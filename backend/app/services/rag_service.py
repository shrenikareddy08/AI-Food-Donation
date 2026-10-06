import json
import logging
import os
import time
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.postgres import AsyncSessionLocal
from app.models.donation import Donation
from app.models.event import Event
from app.models.ngo import NGO
from app.models.rag_log import RAGLog
from app.schemas.rag import RAGQueryResponse, RAGSourceCitation
from app.services.embedding_service import compute_text_embedding, cosine_similarity

logger = logging.getLogger("mealbridge.rag")


class GroundedRAGService:
    """
    Retrieval-Augmented Generation Engine for MealBridge AI.
    Pipeline:
    Query -> 384-dim Embedding -> Vector Retrieval across Donations, NGOs, KB Docs ->
    Context Construction -> Grounded Generation Layer (LLM or Strict Synthesizer) ->
    Audit Logging in PostgreSQL.
    """

    async def retrieve_top_k(
        self,
        session: AsyncSession,
        query_vector: list[float],
        top_k: int = 4
    ) -> list[dict]:
        candidates = []

        # 1. Retrieve Active Donations
        donations_res = await session.execute(
            select(Donation).where(Donation.status.in_(["POSTED", "MATCHED"]))
        )
        for d in donations_res.scalars().all():
            # Build representative text for embedding
            text = f"{d.food_name} {d.food_type or ''} quantity: {d.quantity} {d.unit or ''} at {d.location or ''}"
            # Use stored embedding or calculate
            emb = compute_text_embedding(text)
            sim = cosine_similarity(query_vector, emb)
            candidates.append({
                "type": "DONATION",
                "id": d.donation_id,
                "title": f"Donation #{d.donation_id}: {d.food_name}",
                "content": f"{d.quantity} {d.unit or 'units'} of {d.food_type or 'food'} in {d.location or 'N/A'}. Expires: {d.expiry_time}",
                "similarity": sim
            })

        # 2. Retrieve Verified NGOs
        ngos_res = await session.execute(
            select(NGO).where(NGO.verification_status == "VERIFIED")
        )
        for n in ngos_res.scalars().all():
            text = f"{n.organization_name} capacity: {n.capacity} {n.capacity_unit or ''} requirements: {n.food_requirements or ''} at {n.address or ''}"
            emb = compute_text_embedding(text)
            sim = cosine_similarity(query_vector, emb)
            candidates.append({
                "type": "NGO",
                "id": n.ngo_id,
                "title": f"NGO #{n.ngo_id}: {n.organization_name}",
                "content": f"Capacity: {n.capacity} {n.capacity_unit or 'kg'}. Needs: '{n.food_requirements or 'General'}'. Location: {n.address or 'N/A'}",
                "similarity": sim
            })

        # 3. Retrieve Events with Surplus Food
        events_res = await session.execute(
            select(Event).where(Event.status.in_(["CREATED", "FOOD_AVAILABLE"]))
        )
        for ev in events_res.scalars().all():
            text = f"Event: {ev.event_name} ({ev.event_type}) leftover meals: {ev.estimated_leftover_meals} food: {ev.food_type} at {ev.location}"
            emb = compute_text_embedding(text)
            sim = cosine_similarity(query_vector, emb)
            candidates.append({
                "type": "EVENT",
                "id": ev.event_id,
                "title": f"Event #{ev.event_id}: {ev.event_name}",
                "content": f"Type: {ev.event_type}. Estimated Leftover: ~{ev.estimated_leftover_meals} meals ({ev.food_type}). Location: {ev.location}. Date: {ev.event_date}",
                "similarity": sim
            })

        # Sort descending by similarity score
        candidates.sort(key=lambda x: x["similarity"], reverse=True)
        return candidates[:top_k]

    def _build_context_prompt(self, query: str, records: list[dict]) -> str:
        ctx_lines = ["--- MealBridge Database Context ---"]
        for idx, r in enumerate(records, 1):
            ctx_lines.append(
                f"[{idx}] {r['type']} ({r['title']}) - Match Confidence: {r['similarity'] * 100:.1f}%\n"
                f"    Details: {r['content']}"
            )
        ctx_lines.append("-----------------------------------")
        return "\n".join(ctx_lines)

    async def _call_llm_if_available(self, query: str, context: str) -> str | None:
        """Calls external LLM if API key is configured in environment."""
        api_key = os.getenv("OPENAI_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not api_key:
            return None

        # Clean prompt with zero-hallucination constraint
        system_instruction = (
            "You are MealBridge AI Assistant. Answer the user's question STRICTLY based on the provided MealBridge Database Context. "
            "Never invent or hallucinate donations, NGOs, or quantities. If the context does not contain sufficient information, "
            "say: 'I could not find sufficient matching records in the current MealBridge database.'"
        )

        try:
            if os.getenv("OPENAI_API_KEY"):
                import urllib.request
                req_data = json.dumps({
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {query}"}
                    ],
                    "temperature": 0.2
                }).encode("utf-8")
                req = urllib.request.Request(
                    "https://api.openai.com/v1/chat/completions",
                    data=req_data,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    }
                )
                with urllib.request.urlopen(req, timeout=12) as response:
                    res_body = json.loads(response.read().decode())
                    return res_body["choices"][0]["message"]["content"].strip()
        except Exception as e:
            logger.warning(f"External LLM invocation failed, using local grounded generator: {e}")
            return None

    def _generate_grounded_answer(self, query: str, records: list[dict]) -> str:
        """Deterministic, grounded synthesis when no external LLM API key is present."""
        if not records or records[0]["similarity"] < 0.25:
            return "I could not find sufficient matching records in the current MealBridge database."

        lines = [
            f"Based on the currently available records in the MealBridge AI database, here are the most relevant findings:"
        ]

        donations = [r for r in records if r["type"] == "DONATION"]
        ngos = [r for r in records if r["type"] == "NGO"]
        events = [r for r in records if r["type"] == "EVENT"]

        if donations:
            lines.append("\n**Available Food Donations:**")
            for d in donations:
                lines.append(f"• **{d['title']}**: {d['content']} *(Semantic Match: {d['similarity'] * 100:.1f}%)*")

        if ngos:
            lines.append("\n**Matching NGO Partners:**")
            for n in ngos:
                lines.append(f"• **{n['title']}**: {n['content']} *(Semantic Match: {n['similarity'] * 100:.1f}%)*")

        if events:
            lines.append("\n**Event Surplus Food Sources:**")
            for e in events:
                lines.append(f"• **{e['title']}**: {e['content']} *(Semantic Match: {e['similarity'] * 100:.1f}%)*")

        lines.append(
            "\n*Verification Note: All information is directly grounded in live MealBridge records with zero hypothetical data.*"
        )
        return "\n".join(lines)

    async def answer_query(
        self,
        query: str,
        user_id: int | None = None,
        top_k: int = 3
    ) -> RAGQueryResponse:
        start_time = time.time()
        query_vector = compute_text_embedding(query)

        async with AsyncSessionLocal() as session:
            records = await self.retrieve_top_k(session, query_vector, top_k=top_k)
            context = self._build_context_prompt(query, records)

            # Attempt LLM generation or fall back to structured grounding
            answer = await self._call_llm_if_available(query, context)
            if not answer:
                answer = self._generate_grounded_answer(query, records)

            top_score = records[0]["similarity"] if records else 0.0

            # Log to PostgreSQL rag_retrieval_logs
            try:
                retrieved_summary = ", ".join([f"{r['type']}:{r['id']}" for r in records])
                rag_log = RAGLog(
                    user_id=user_id,
                    query=query,
                    retrieved_chunks=retrieved_summary,
                    response=answer,
                    similarity_top_score=round(top_score, 4)
                )
                session.add(rag_log)
                await session.commit()
            except Exception as ex:
                logger.warning(f"Could not persist RAG log: {ex}")

        exec_time = round((time.time() - start_time) * 1000, 2)
        citations = [
            RAGSourceCitation(
                source_type=r["type"],
                title=r["title"],
                content_snippet=r["content"],
                similarity=round(r["similarity"], 4)
            ) for r in records
        ]

        return RAGQueryResponse(
            question=query,
            answer=answer,
            grounded=True,
            sources=citations,
            retrieval_count=len(records),
            execution_time_ms=exec_time
        )


rag_service = GroundedRAGService()

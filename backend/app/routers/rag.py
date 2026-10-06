from fastapi import APIRouter, Depends, Request

from app.core.dependencies import get_current_user
from app.core.rate_limiter import rag_rate_limiter
from app.schemas.rag import RAGQueryRequest, RAGQueryResponse
from app.services.rag_service import rag_service

router = APIRouter(
    prefix="/api/rag",
    tags=["RAG AI Assistant"]
)


@router.post("/query", response_model=RAGQueryResponse)
async def query_rag_assistant(
    data: RAGQueryRequest,
    request: Request,
    current_user: dict | None = Depends(get_current_user)
):
    """
    Retrieval-Augmented Generation (RAG) Question-Answering Endpoint.
    1. Embeds question with 384-dimensional semantic vectors.
    2. Retrieves top-k matching MealBridge records from PostgreSQL & pgvector.
    3. Synthesizes a strictly grounded answer with zero hallucinations.
    4. Audits query and retrieval quality in PostgreSQL rag_retrieval_logs.
    """
    # Rate limit check: max 20 queries/minute
    rag_rate_limiter.check(request)

    user_id = current_user.get("user_id") if current_user else None

    response = await rag_service.answer_query(
        query=data.question,
        user_id=user_id,
        top_k=data.top_k
    )

    return response

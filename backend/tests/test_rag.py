import pytest
from app.services.rag_service import rag_service
from app.schemas.rag import RAGQueryRequest, RAGSourceCitation, RAGQueryResponse


def test_rag_query_request_schema():
    req = RAGQueryRequest(
        question="Which food donations are suitable for an NGO with 40 children?",
        top_k=5
    )
    assert req.top_k == 5
    assert "children" in req.question


def test_rag_source_citation_schema():
    citation = RAGSourceCitation(
        source_type="DONATION",
        title="Donation #1: Cooked Rice",
        content_snippet="50 KG Cooked Rice in Hyderabad",
        similarity=0.8845
    )
    assert citation.source_type == "DONATION"
    assert citation.similarity == 0.8845
    assert citation.title == "Donation #1: Cooked Rice"


def test_rag_grounded_answer_generation():
    records = [
        {
            "type": "DONATION",
            "id": 10,
            "title": "Donation #10: Vegetable Biryani",
            "content": "30 KG of Cooked Food in Banjara Hills. Expires: 2026-10-06 22:00:00",
            "similarity": 0.85
        },
        {
            "type": "NGO",
            "id": 3,
            "title": "Helping Hands Children Home",
            "content": "Capacity 100 KG. Food requirements: Cooked meals for 50 kids.",
            "similarity": 0.79
        }
    ]
    query = "Find biryani donations for children home"
    answer = rag_service._generate_grounded_answer(query, records)

    # Must be grounded in live retrieved records
    assert "MealBridge AI database" in answer
    assert "Vegetable Biryani" in answer
    assert "Helping Hands Children Home" in answer
    assert "85.0%" in answer


def test_rag_insufficient_records_handling():
    records = []
    answer = rag_service._generate_grounded_answer("Unknown random query", records)
    assert "could not find sufficient matching records" in answer

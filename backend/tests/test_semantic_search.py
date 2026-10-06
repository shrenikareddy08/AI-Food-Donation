import pytest
import math
from app.services.embedding_service import compute_text_embedding, cosine_similarity
from app.schemas.search import SemanticSearchRequest, SearchFilterParams


def test_embedding_generation_dimension():
    text = "Fresh cooked vegetarian meals for children at NGO shelter"
    vec = compute_text_embedding(text)
    assert len(vec) == 384
    assert all(isinstance(x, float) for x in vec)


def test_embedding_deterministic_property():
    text = "Urgent requirement for diabetic friendly breakfast"
    vec1 = compute_text_embedding(text)
    vec2 = compute_text_embedding(text)
    assert vec1 == vec2


def test_cosine_similarity_identical_vectors():
    vec = compute_text_embedding("Paneer curry and chapati")
    sim = cosine_similarity(vec, vec)
    assert sim == pytest.approx(1.0, 0.0001)


def test_cosine_similarity_semantic_relevance():
    query_vec = compute_text_embedding("meals suitable for children orphanage")
    similar_vec = compute_text_embedding("healthy milk and bread donation for school kids")
    dissimilar_vec = compute_text_embedding("industrial hydraulic forklift spare parts")

    score_similar = cosine_similarity(query_vec, similar_vec)
    score_dissimilar = cosine_similarity(query_vec, dissimilar_vec)

    assert score_similar > score_dissimilar


def test_vector_normalization():
    vec = compute_text_embedding("Large wedding surplus buffet")
    norm = math.sqrt(sum(x * x for x in vec))
    assert norm == pytest.approx(1.0, 0.01)


def test_semantic_search_request_schema():
    req = SemanticSearchRequest(
        query="food suitable for 50 people expiring tonight",
        limit=10,
        similarity_threshold=0.35,
        filters=SearchFilterParams(
            city="Hyderabad",
            food_type="Cooked Food",
            max_distance_km=15.0
        )
    )
    assert req.limit == 10
    assert req.similarity_threshold == 0.35
    assert req.filters.city == "Hyderabad"
    assert req.filters.food_type == "Cooked Food"

from pydantic import BaseModel, Field


class RAGSourceCitation(BaseModel):
    source_type: str  # 'DONATION', 'NGO', 'KB_DOCUMENT', 'EVENT'
    title: str
    content_snippet: str
    similarity: float


class RAGQueryRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=1000)
    top_k: int = Field(3, ge=1, le=10)


class RAGQueryResponse(BaseModel):
    question: str
    answer: str
    grounded: bool
    sources: list[RAGSourceCitation]
    retrieval_count: int
    execution_time_ms: float

from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class UpsertResponse(BaseModel):
    image_id: str
    status: str
    metadata: Dict[str, Any]

class RetrievedRecord(BaseModel):
    image_id: str
    metadata: Dict[str, Any]
    similarity: float = Field(..., ge=0.0, le=1.0)

class RetrieveResponse(BaseModel):
    results: List[RetrievedRecord]

class RecordResponse(BaseModel):
    image_id: str
    metadata: Dict[str, Any]
    embedding_preview: List[float] = Field(..., description="First 5 values of the embedding")

class DeleteResponse(BaseModel):
    image_id: str
    status: str
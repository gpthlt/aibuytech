from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime

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

class Review(BaseModel):
    id: str
    content: str
    rating: float
    date: datetime
    verified_purchase: Optional[bool] = False

class Product(BaseModel):
    id: str
    name: str
    reviews: Optional[List[Review]] = []
    description: Optional[str] = None  # Optional product description about the information
    price: float = None  # Optional product price
    category: str = None  # Optional product category
    brand: str = None  # Optional product brand
    stock: int = None  # Optional product stock quantity

class ReviewFilter(BaseModel):
    min_rating: float = 1.0
    max_rating: float = 5.0
    verified_only: bool = False
    date_from: Optional[datetime] = None
    max_reviews_per_product: int = 50

class AspectAnalysis(BaseModel):
    aspect: str
    sentiment: float = Field(..., description="Sentiment score -1..1")
    summary: str
    key_quotes: List[str]

class ComparisonResponse(BaseModel):
    product_summaries: Dict[str, List[AspectAnalysis]]
    overall_comparison: str
    satisfaction_rates: Dict[str, float]

class ComparisonRequest(BaseModel):
    products: List[Product]

class ProductConstraint(BaseModel):
    category: Optional[str] = None
    budget: Optional[float] = None
    expression: Optional[Literal["Less", "More"]] = None

class ContextRequest(BaseModel):
    user_query: str

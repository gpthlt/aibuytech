import time
import os

import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body

from schemas import (UpsertResponse, RetrieveResponse,DeleteResponse, 
                     ComparisonRequest, AspectAnalysis, 
                     ComparisonResponse, ContextRequest, ProductConstraint)

from utils.review_filter import filter_representative_reviews
from engines import VectorDB, ImageEmbedder, LLMEngine

# Init app instances
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env")

vector_dim = int(os.environ.get("VECTOR_DIM"))
milvus_host = os.environ.get("MILVUS_HOST")
milvus_port = os.environ.get("MILVUS_PORT")
collection_name = os.environ.get("COLLECTION_NAME")
openai_api_key = os.environ.get("OPENAI_API_KEY")

model_path = os.environ.get("MODEL_PATH")
device = os.environ.get("DEVICE")


@asynccontextmanager
async def lifespan(app: FastAPI):
    global vdb, embedder, llm
    vdb = VectorDB(dim=vector_dim, milvus_host=milvus_host, milvus_port=milvus_port, collection_name=collection_name)
    embedder = ImageEmbedder(model_name_or_path=model_path, device=device)
    llm = LLMEngine(openai_api_key=openai_api_key)
    yield

app = FastAPI(
    title="AI Service API",
    description="",
    version="0.1.0",
    lifespan=lifespan,
    root_path="/api/v1"
)

@app.get("/health", tags=["General"])
async def health():
    """A health check endpoint."""
    return {"status": "ok", "message": "AI service is running."}


@app.post("/upsert/", response_model=UpsertResponse, tags=["Images"])
async def upsert_image(
    image_id: str = Form(...),
    image_bytes: UploadFile = File(...),
    item_id: str = Form(...),
):
    try:
        raw = await image_bytes.read()  # bytes

        # Embed the image
        embedding = await embedder.embed(raw)

        # Prepare metadata
        metadata = {
            "item_id": item_id,
            "created_at": int(time.time()),
        }

        # Upsert into the vector vdb
        status = await vdb.upsert_vector(id=image_id, vector=embedding, metadata=metadata)

        if status:
            return UpsertResponse(image_id=image_id, status="success", metadata=metadata)
        else:
            return UpsertResponse(image_id=image_id, status="fail", metadata=metadata)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Image processing error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")


@app.post("/retrieve/", response_model=RetrieveResponse, tags=["Search"])
async def retrieve_similar_images(
    top_k: int = Form(5),
    image_bytes: UploadFile = File(...),
):
    try:

        raw = await image_bytes.read()

        # Embed the query image
        query_embedding = await embedder.embed(raw)

        # Retrieve similar items from the vdb
        results = await vdb.retrieve_similar(query_vector=query_embedding, top_k=top_k)

        return RetrieveResponse(results=results)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Image processing error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")


@app.delete("/record/{image_id}", response_model=DeleteResponse, tags=["Images"])
async def delete_record(image_id: str):
    """
    Delete an image record (embedding and metadata) from the database.
    """
    success = await vdb.delete(image_id)
    if not success:
        raise HTTPException(status_code=404, detail="Image ID not found")
        
    return DeleteResponse(image_id=image_id, status="deleted")


@app.post("/compare/", response_model=ComparisonResponse, tags=["Product"])
async def compare_product(
    request: ComparisonRequest = Body(...)
):
    """Compare user experiences between 2-4 products."""
    if not (2 <= len(request.products) <= 4):
        raise HTTPException(status_code=400, detail="Please select between 2-4 products for comparison.")
    product_summaries = {}
    satisfaction_rates = {}

    try:
        for product in request.products:
            filtered_reviews = filter_representative_reviews(product.reviews)
            if not filtered_reviews:
                raise HTTPException(status_code=400, detail=f"No valid reviews found for {product.name}")

            product.reviews = filtered_reviews
            analysis = await llm.analyze_product(product)
            product_summaries[product.id] = [
                AspectAnalysis(**a) for a in analysis["aspects"]
            ]
            satisfaction_rates[product.id] = analysis["satisfaction_rate"]

        overall_summary = await llm.compare_products(product_summaries)

        return ComparisonResponse(
            product_summaries=product_summaries,
            satisfaction_rates=satisfaction_rates,
            overall_comparison=overall_summary,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/constraint/", response_model=ProductConstraint, tags=["Product"])
async def constraint_product(request: ContextRequest):
    try:
        constraints = await llm.extract_constraints_from_query(request.user_query)
        return ProductConstraint(**constraints)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Run AI Service API Server")
    parser.add_argument("--host", type=str, default="localhost", help="Host to run the server on")
    parser.add_argument("--port", type=int, default=8003, help="Port to run the server on")
    args = parser.parse_args()

    uvicorn.run(
        "server:app",
        host=args.host,
        port=args.port,
        reload=True
    )
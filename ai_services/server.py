import time
import os

import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from PIL import Image

from schemas import UpsertResponse, RetrievedRecord, RetrieveResponse, RecordResponse, DeleteResponse

from engines import VectorDB, ImageEmbedder

# Init app instances 
from dotenv import load_dotenv

load_dotenv(dotenv_path="local.env")

vector_dim = int(os.environ.get("VECTOR_DIM"))
milvus_host = os.environ.get("MILVUS_HOST")
milvus_port = os.environ.get("MILVUS_PORT")
collection_name = os.environ.get("COLLECTION_NAME")

model_path = os.environ.get("MODEL_PATH")
device = os.environ.get("DEVICE")


@asynccontextmanager
async def lifespan(app: FastAPI):
    global vdb, embedder
    vdb = VectorDB(dim=vector_dim, milvus_host=milvus_host, milvus_port=milvus_port, collection_name=collection_name)
    embedder = ImageEmbedder(model_name_or_path=model_path, device=device)
    yield 

app = FastAPI(
    title="AI Service API",
    description="",
    version="0.1.0",
    lifespan=lifespan
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


# @app.get("/record/{image_id}", response_model=RecordResponse, tags=["Images"])
# async def get_record(image_id: str):
#     """
#     Get the stored metadata and an embedding preview for a specific image ID.
#     """
#     record = await vdb.get_by_id(image_id)
#     if not record:
#         raise HTTPException(status_code=404, detail="Image ID not found")
        
#     # embedding preview
#     embedding_preview = record.get("embedding", [])[:5]
    
#     return RecordResponse(
#         image_id=image_id,
#         metadata=record.get("metadata", {}),
#         embedding_preview=embedding_preview
#     )

@app.delete("/record/{image_id}", response_model=DeleteResponse, tags=["Images"])
async def delete_record(image_id: str):
    """
    Delete an image record (embedding and metadata) from the database.
    """
    success = await vdb.delete(image_id)
    if not success:
        raise HTTPException(status_code=404, detail="Image ID not found")
        
    return DeleteResponse(image_id=image_id, status="deleted")


if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="127.0.0.1",
        port=8003,
        reload=True
    )
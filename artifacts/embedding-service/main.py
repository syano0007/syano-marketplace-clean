import os
import time
import logging
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

MODEL_NAME = "intfloat/multilingual-e5-small"
MAX_BATCH = 64

model = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    logger.info(f"Loading embedding model: {MODEL_NAME}")
    t0 = time.time()
    try:
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer(MODEL_NAME)
        elapsed_ms = int((time.time() - t0) * 1000)
        logger.info(f"Model loaded in {elapsed_ms}ms — dimensions: 384")
    except Exception as e:
        logger.error(f"FATAL: Failed to load model {MODEL_NAME}: {e}")
        raise SystemExit(1)
    yield
    model = None


app = FastAPI(title="SYANO Embedding Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryEmbedRequest(BaseModel):
    text: str
    language: Optional[str] = None


class BatchEmbedRequest(BaseModel):
    texts: list[str]
    type: str = "passage"


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "vector_dimensions": 384,
    }


@app.post("/embed/query")
def embed_query(req: QueryEmbedRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    t0 = time.time()
    prefixed = f"query: {req.text}"

    try:
        embedding = model.encode(
            [prefixed],
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        processing_ms = int((time.time() - t0) * 1000)
        return {
            "embedding": embedding[0].tolist(),
            "dimensions": len(embedding[0]),
            "processing_ms": processing_ms,
        }
    except Exception as e:
        logger.error(f"embed/query error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/embed/batch")
def embed_batch(req: BatchEmbedRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    if not req.texts:
        return {"embeddings": [], "count": 0, "processing_ms": 0}

    t0 = time.time()
    prefix = "passage: " if req.type == "passage" else "query: "

    all_embeddings = []
    texts = req.texts

    for chunk_start in range(0, len(texts), MAX_BATCH):
        chunk = texts[chunk_start : chunk_start + MAX_BATCH]
        prefixed = [f"{prefix}{t}" for t in chunk]
        try:
            batch_emb = model.encode(
                prefixed,
                batch_size=32,
                normalize_embeddings=True,
                show_progress_bar=False,
            )
            all_embeddings.extend(batch_emb.tolist())
        except Exception as e:
            logger.error(f"embed/batch chunk {chunk_start} error: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    processing_ms = int((time.time() - t0) * 1000)
    return {
        "embeddings": all_embeddings,
        "count": len(all_embeddings),
        "processing_ms": processing_ms,
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("EMBEDDING_PORT", "8001"))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        workers=1,
        timeout_keep_alive=120,
    )

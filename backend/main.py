import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
import uvicorn
from rag_engine import RAGEngine
from scraper import scrape_url

app = FastAPI(title="RAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag = RAGEngine()


class ChatRequest(BaseModel):
    message: str
    collection_name: str = "default"


class ScrapeRequest(BaseModel):
    url: str
    collection_name: Optional[str] = None


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/chat")
async def chat(req: ChatRequest):
    try:
        response = await rag.query(req.message, req.collection_name)
        return {"response": response, "collection": req.collection_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    collection_name: str = Form(default="default"),
):
    try:
        content = await file.read()
        result = await rag.ingest_document(content, file.filename, collection_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/scrape")
async def scrape(req: ScrapeRequest):
    try:
        if not req.collection_name:
            domain = req.url.split("//")[-1].split("/")[0]
            collection_name = domain.replace(".", "_").replace("-", "_")[:50]
        else:
            collection_name = req.collection_name

        content = await scrape_url(req.url)
        result = await rag.ingest_text(content, req.url, collection_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/chunks/{collection_name}")
async def get_chunks(collection_name: str):
    try:
        chunks = await rag.get_chunks(collection_name)
        return {"collection": collection_name, "chunks": chunks, "total": len(chunks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/sources")
async def get_sources():
    try:
        sources = await rag.list_sources()
        return {"sources": sources}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/sources/{collection_name}")
async def delete_source(collection_name: str):
    try:
        await rag.delete_collection(collection_name)
        return {"message": f"Deleted collection {collection_name}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Serve Next.js static build — must be last so API routes take priority
_static = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(_static):
    app.mount("/", StaticFiles(directory=_static, html=True), name="frontend")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)

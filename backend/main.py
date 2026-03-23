from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import json
import csv
import io

from .models import GenerationRequest, GenerationResponse
from .generator import generate_samples
from .validator import validate_batch, compute_stats

app = FastAPI(title="DataGen Framework API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "DataGen Framework is running 🚀"}

@app.post("/generate", response_model=GenerationResponse)
async def generate(req: GenerationRequest):
    try:
        samples = await generate_samples(req)
        samples = validate_batch(samples, req.task_type, req.labels)
        stats = compute_stats(samples, req.task_type)
        valid_samples = [s for s in samples if s.validation and s.validation.is_valid]

        return GenerationResponse(
            task_type=req.task_type,
            domain=req.domain,
            total_requested=req.num_samples,
            total_generated=len(samples),
            total_valid=len(valid_samples),
            samples=samples,
            stats=stats,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
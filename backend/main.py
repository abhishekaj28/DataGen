import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .models import GenerationRequest, GenerationResponse
from .generator import generate_samples, LLMProviderError
from .validator import validate_batch, compute_stats

logger = logging.getLogger(__name__)

app = FastAPI(title="DataGen Framework API", version="1.0.0")

# Open CORS is fine for local development; restrict allow_origins before deploying.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "DataGen Framework is running"}


@app.post("/generate", response_model=GenerationResponse)
async def generate(req: GenerationRequest):
    try:
        samples, source, provider = await generate_samples(req)
    except LLMProviderError as e:
        # The LLM provider rejected the call (invalid key, quota, network)
        logger.warning("LLM provider error: %s", e)
        raise HTTPException(status_code=502, detail=str(e))
    except ValueError as e:
        # Bad request settings, or the model returned something that is not valid JSON
        logger.warning("Generation error: %s", e)
        raise HTTPException(status_code=502, detail=str(e))
    except Exception:
        logger.exception("Unexpected error during generation")
        raise HTTPException(status_code=500, detail="Internal error during generation")

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
        source=source,
        provider=provider,
    )

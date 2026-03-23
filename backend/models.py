from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from enum import Enum

class TaskType(str, Enum):
    classification = "classification"
    summarization = "summarization"
    qa = "qa"
    ner = "ner"
    intent = "intent"

class GenerationRequest(BaseModel):
    task_type: TaskType
    domain: str
    num_samples: int = Field(default=10, ge=1, le=50)
    labels: Optional[List[str]] = None
    language: Optional[str] = "English"
    include_edge_cases: bool = True
    custom_instructions: Optional[str] = None
    llm_provider: Optional[str] = "anthropic"
    api_key: Optional[str] = None

class ValidationResult(BaseModel):
    is_valid: bool
    issues: List[str] = []
    score: float

class DataSample(BaseModel):
    id: int
    input: str
    output: Any
    metadata: Dict[str, Any] = {}
    validation: Optional[ValidationResult] = None

class GenerationResponse(BaseModel):
    task_type: TaskType
    domain: str
    total_requested: int
    total_generated: int
    total_valid: int
    samples: List[DataSample]
    stats: Dict[str, Any] = {}
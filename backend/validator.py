from .models import TaskType, ValidationResult, DataSample
from typing import List

def validate_sample(sample: dict, task_type: TaskType, labels: List[str] = None) -> ValidationResult:
    issues = []
    score = 1.0

    inp = sample.get("input", "")
    out = sample.get("output")

    # Universal checks
    if not inp or len(str(inp).strip()) < 5:
        issues.append("Input too short or empty")
        score -= 0.4

    if out is None or (isinstance(out, str) and len(out.strip()) == 0):
        issues.append("Output is empty or missing")
        score -= 0.4

    # Task specific checks
    if task_type in (TaskType.classification, TaskType.intent):
        if labels and isinstance(out, str):
            if out.lower() not in [l.lower() for l in labels]:
                issues.append(f"Label '{out}' not in allowed labels")
                score -= 0.3

    elif task_type == TaskType.qa:
        if isinstance(out, str) and len(out.strip()) < 5:
            issues.append("Answer too short")
            score -= 0.2

    elif task_type == TaskType.summarization:
        if isinstance(inp, str) and isinstance(out, str):
            if len(out) >= len(inp) * 0.9:
                issues.append("Summary is not shorter than input")
                score -= 0.3

    elif task_type == TaskType.ner:
        if not isinstance(out, list):
            issues.append("NER output should be a list of entities")
            score -= 0.4

    score = max(0.0, round(score, 2))
    return ValidationResult(is_valid=score >= 0.5, issues=issues, score=score)


def validate_batch(samples: List[DataSample], task_type: TaskType, labels: List[str] = None) -> List[DataSample]:
    for sample in samples:
        raw = {"input": sample.input, "output": sample.output}
        sample.validation = validate_sample(raw, task_type, labels)
    return samples


def compute_stats(samples: List[DataSample], task_type: TaskType) -> dict:
    valid_count = sum(1 for s in samples if s.validation and s.validation.is_valid)
    avg_score = round(sum(s.validation.score for s in samples if s.validation) / max(len(samples), 1), 2)

    stats = {
        "valid_count": valid_count,
        "invalid_count": len(samples) - valid_count,
        "avg_validation_score": avg_score,
    }

    if task_type in (TaskType.classification, TaskType.intent):
        label_dist = {}
        for s in samples:
            lbl = str(s.output)
            label_dist[lbl] = label_dist.get(lbl, 0) + 1
        stats["label_distribution"] = label_dist

    return stats
import re
from typing import List, Optional

from .models import TaskType, ValidationResult, DataSample
from .privacy import detect_pii, redact_text, map_strings, collect_strings

NEAR_DUPLICATE_THRESHOLD = 0.9

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


def _normalise(text: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s]", "", str(text).lower())).strip()


def _jaccard(a: set, b: set) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def _penalise(sample: DataSample, issue: str, amount: float) -> None:
    v = sample.validation
    v.issues.append(issue)
    v.score = max(0.0, round(v.score - amount, 2))
    v.is_valid = v.score >= 0.5


def mark_duplicates(samples: List[DataSample]) -> None:
    """Flag exact and near-duplicate inputs (word-set Jaccard similarity >= 0.9)."""
    seen = []  # (sample id, normalised text, word set)
    for sample in samples:
        norm = _normalise(sample.input)
        words = set(norm.split())
        for other_id, other_norm, other_words in seen:
            if norm and norm == other_norm:
                _penalise(sample, f"Duplicate of sample {other_id}", 0.3)
                break
            if len(words) >= 4 and _jaccard(words, other_words) >= NEAR_DUPLICATE_THRESHOLD:
                _penalise(sample, f"Near-duplicate of sample {other_id}", 0.3)
                break
        seen.append((sample.id, norm, words))


def validate_batch(
    samples: List[DataSample],
    task_type: TaskType,
    labels: List[str] = None,
    redact_pii: bool = False,
) -> List[DataSample]:
    for sample in samples:
        if redact_pii:
            found = detect_pii(sample.input) + detect_pii(collect_strings(sample.output))
            if found:
                sample.input = redact_text(sample.input)
                sample.output = map_strings(sample.output, redact_text)
                sample.metadata = {**sample.metadata, "pii_redacted": sorted(set(found))}

        raw = {"input": sample.input, "output": sample.output}
        sample.validation = validate_sample(raw, task_type, labels)

        pii = sorted(set(detect_pii(sample.input) + detect_pii(collect_strings(sample.output))))
        if pii:
            sample.validation.pii_types = pii
            _penalise(sample, "Possible personal data: " + ", ".join(pii), 0.3)

    mark_duplicates(samples)
    return samples


def diversity_stats(samples: List[DataSample]) -> dict:
    inputs = [_normalise(s.input) for s in samples]
    words = [w for t in inputs for w in t.split()]
    lengths = [len(t.split()) for t in inputs]
    return {
        "lexical_diversity": round(len(set(words)) / len(words), 3) if words else 0.0,
        "unique_input_ratio": round(len(set(inputs)) / len(inputs), 3) if inputs else 0.0,
        "avg_input_words": round(sum(lengths) / len(lengths), 1) if lengths else 0.0,
        "min_input_words": min(lengths) if lengths else 0,
        "max_input_words": max(lengths) if lengths else 0,
    }


def compute_stats(samples: List[DataSample], task_type: TaskType) -> dict:
    valid_count = sum(1 for s in samples if s.validation and s.validation.is_valid)
    avg_score = round(sum(s.validation.score for s in samples if s.validation) / max(len(samples), 1), 2)
    duplicate_count = sum(
        1 for s in samples
        if s.validation and any(i.startswith(("Duplicate of", "Near-duplicate of")) for i in s.validation.issues)
    )
    pii_flagged = sum(1 for s in samples if s.validation and s.validation.pii_types)
    pii_redacted = sum(1 for s in samples if s.metadata.get("pii_redacted"))

    stats = {
        "valid_count": valid_count,
        "invalid_count": len(samples) - valid_count,
        "avg_validation_score": avg_score,
        "duplicate_count": duplicate_count,
        "pii_flagged_count": pii_flagged,
        "pii_redacted_count": pii_redacted,
        "diversity": diversity_stats(samples),
    }

    if task_type in (TaskType.classification, TaskType.intent):
        label_dist = {}
        for s in samples:
            lbl = str(s.output)
            label_dist[lbl] = label_dist.get(lbl, 0) + 1
        stats["label_distribution"] = label_dist

    return stats

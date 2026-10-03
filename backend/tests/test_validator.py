from backend.models import TaskType
from backend.validator import validate_sample, compute_stats, validate_batch
from backend.models import DataSample


def test_valid_classification_sample():
    r = validate_sample(
        {"input": "Great product, works well", "output": "positive"},
        TaskType.classification,
        ["positive", "negative"],
    )
    assert r.is_valid and r.score == 1.0 and r.issues == []


def test_label_outside_allowed_set_is_flagged():
    r = validate_sample(
        {"input": "Great product, works well", "output": "amazing"},
        TaskType.classification,
        ["positive", "negative"],
    )
    assert any("not in allowed labels" in i for i in r.issues)
    assert r.score == 0.7


def test_empty_input_and_output_are_invalid():
    r = validate_sample({"input": "", "output": None}, TaskType.qa)
    assert not r.is_valid


def test_summary_must_be_shorter_than_input():
    text = "x" * 100
    r = validate_sample({"input": text, "output": text}, TaskType.summarization)
    assert any("not shorter" in i for i in r.issues)


def test_ner_output_must_be_a_list():
    r = validate_sample({"input": "Tim Cook visited Paris", "output": "Tim Cook"}, TaskType.ner)
    assert any("list of entities" in i for i in r.issues)


def test_compute_stats_label_distribution():
    samples = [
        DataSample(id=1, input="aaaaaa", output="a"),
        DataSample(id=2, input="bbbbbb", output="a"),
        DataSample(id=3, input="cccccc", output="b"),
    ]
    validate_batch(samples, TaskType.classification, ["a", "b"])
    stats = compute_stats(samples, TaskType.classification)
    assert stats["label_distribution"] == {"a": 2, "b": 1}
    assert stats["valid_count"] == 3


def _batch(inputs, task=TaskType.classification, redact=False):
    samples = [DataSample(id=i + 1, input=t, output="positive") for i, t in enumerate(inputs)]
    validate_batch(samples, task, ["positive", "negative"], redact_pii=redact)
    return samples


def test_exact_duplicates_are_flagged():
    samples = _batch(["The service was excellent today", "the service was excellent today!"])
    assert samples[0].validation.issues == []
    assert any(i.startswith("Duplicate of sample 1") for i in samples[1].validation.issues)
    assert compute_stats(samples, TaskType.classification)["duplicate_count"] == 1


def test_near_duplicates_are_flagged_but_different_text_is_not():
    near = _batch(["the quick brown fox jumps over a lazy sleeping dog",
                   "the quick brown fox jumps over a lazy sleeping dog today"])
    assert any(i.startswith("Near-duplicate") for i in near[1].validation.issues)
    different = _batch(["fast shipping and good packaging", "the app crashes whenever I log in"])
    assert all(not s.validation.issues for s in different)


def test_pii_is_flagged_and_lowers_the_score():
    samples = _batch(["Please email me at jane@example.com about the refund"])
    v = samples[0].validation
    assert v.pii_types == ["email"]
    assert v.score == 0.7
    assert compute_stats(samples, TaskType.classification)["pii_flagged_count"] == 1


def test_redaction_removes_pii_before_validation():
    samples = _batch(["Call me on 9876543210 about the refund"], redact=True)
    assert "9876543210" not in samples[0].input
    assert samples[0].metadata["pii_redacted"] == ["phone"]
    assert samples[0].validation.pii_types == []
    assert compute_stats(samples, TaskType.classification)["pii_redacted_count"] == 1


def test_diversity_stats():
    samples = _batch(["good product", "good product", "bad service"])
    d = compute_stats(samples, TaskType.classification)["diversity"]
    assert d["unique_input_ratio"] == round(2 / 3, 3)
    assert d["avg_input_words"] == 2.0
    assert d["min_input_words"] == d["max_input_words"] == 2

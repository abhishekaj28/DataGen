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

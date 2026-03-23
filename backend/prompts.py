from .models import TaskType

SYSTEM_PROMPT = """You are a synthetic data generation expert. Your job is to create high-quality, 
diverse, realistic training data for machine learning models. Always return valid JSON arrays.
Generate data that includes edge cases, adversarial examples, and diverse linguistic patterns — 
not just typical happy-path examples."""

def get_prompt(task_type, domain, num_samples, labels=None,
               language="English", include_edge_cases=True, custom_instructions=None):

    edge_case_note = """
Also include some edge cases such as:
- Ambiguous or borderline examples
- Short or very long inputs
- Informal or noisy language
- Uncommon but valid scenarios
""" if include_edge_cases else ""

    custom_note = f"\nAdditional instructions: {custom_instructions}" if custom_instructions else ""

    if task_type == TaskType.classification:
        label_str = ", ".join(labels) if labels else "positive, negative, neutral"
        return f"""Generate {num_samples} synthetic text classification samples in the {domain} domain.
Language: {language}
Labels to use: {label_str}
Return a JSON array: [{{"input": "text", "output": "label", "metadata": {{"confidence": "high|medium|low"}}}}]
{edge_case_note}{custom_note}
Return ONLY the JSON array, no extra text."""

    elif task_type == TaskType.qa:
        return f"""Generate {num_samples} synthetic question-answer pairs in the {domain} domain.
Language: {language}
Return a JSON array: [{{"input": "question", "output": "answer", "metadata": {{"difficulty": "easy|medium|hard"}}}}]
{edge_case_note}{custom_note}
Return ONLY the JSON array, no extra text."""

    elif task_type == TaskType.summarization:
        return f"""Generate {num_samples} summarization samples in the {domain} domain.
Language: {language}
Return a JSON array: [{{"input": "long passage", "output": "short summary", "metadata": {{"compression_ratio": "high|medium|low"}}}}]
{edge_case_note}{custom_note}
Return ONLY the JSON array, no extra text."""

    elif task_type == TaskType.ner:
        return f"""Generate {num_samples} Named Entity Recognition samples in the {domain} domain.
Language: {language}
Return a JSON array: [{{"input": "sentence", "output": [{{"entity": "text", "label": "PERSON|ORG|LOC|DATE", "start": 0, "end": 5}}], "metadata": {{"entity_count": 2}}}}]
{edge_case_note}{custom_note}
Return ONLY the JSON array, no extra text."""

    elif task_type == TaskType.intent:
        label_str = ", ".join(labels) if labels else "book_flight, cancel_order, check_status, get_support"
        return f"""Generate {num_samples} intent detection samples in the {domain} domain.
Language: {language}
Intents: {label_str}
Return a JSON array: [{{"input": "user message", "output": "intent", "metadata": {{"confidence": "high|medium|low"}}}}]
{edge_case_note}{custom_note}
Return ONLY the JSON array, no extra text."""
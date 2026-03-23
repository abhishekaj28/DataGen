import json
import os
import re
from typing import List
from .models import TaskType, DataSample, GenerationRequest
from .prompts import get_prompt, SYSTEM_PROMPT

from google import genai
from google.genai import types

# Load .env if present
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


def clean_json_response(text: str) -> str:
    text = re.sub(r"```(?:json)?", "", text).strip()
    text = text.strip("`").strip()
    return text


async def generate_with_anthropic(prompt: str, api_key: str) -> str:
    import anthropic
    client = anthropic.Anthropic(api_key=api_key)
    msg = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}]
    )
    return msg.content[0].text


async def generate_with_openai(prompt: str, api_key: str) -> str:
    from openai import OpenAI
    client = OpenAI(api_key=api_key)
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        max_tokens=4096,
    )
    return resp.choices[0].message.content


async def generate_with_gemini(prompt: str, api_key: str) -> str:
    client = genai.Client(api_key=api_key)
    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
        )
    )
    return response.text


async def generate_samples(req: GenerationRequest) -> List[DataSample]:
    prompt = get_prompt(
        task_type=req.task_type,
        domain=req.domain,
        num_samples=req.num_samples,
        labels=req.labels,
        language=req.language,
        include_edge_cases=req.include_edge_cases,
        custom_instructions=req.custom_instructions,
    )

    # Resolve API key: prefer request key, then fallback to env
    provided_key = req.api_key or ""
    provider = req.llm_provider or "gemini"

    if provider == "openai" and provided_key:
        raw = await generate_with_openai(prompt, provided_key)
    elif provider == "anthropic" and provided_key:
        raw = await generate_with_anthropic(prompt, provided_key)
    elif provider == "gemini" and provided_key:
        raw = await generate_with_gemini(prompt, provided_key)
    else:
        # No key available — return mock data
        print("⚠️  No API key found — returning mock data.")
        return _mock_samples(req)

    cleaned = clean_json_response(raw)

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r'\[.*\]', cleaned, re.DOTALL)
        if match:
            data = json.loads(match.group())
        else:
            raise ValueError(f"LLM did not return valid JSON. Response was:\n{cleaned[:500]}")

    if not isinstance(data, list):
        raise ValueError("Expected a JSON array from LLM.")

    samples = []
    for i, item in enumerate(data):
        samples.append(DataSample(
            id=i + 1,
            input=str(item.get("input", "")),
            output=item.get("output"),
            metadata=item.get("metadata", {}),
        ))

    return samples


def _mock_samples(req: GenerationRequest) -> List[DataSample]:
    mock_map = {
        TaskType.classification: [
            {"input": "The new policy disrupted our workflow completely.", "output": "negative", "metadata": {"confidence": "high"}},
            {"input": "Results were mixed but generally acceptable.", "output": "neutral", "metadata": {"confidence": "medium"}},
            {"input": "Outstanding performance this quarter!", "output": "positive", "metadata": {"confidence": "high"}},
            {"input": "Not sure how I feel about this change.", "output": "neutral", "metadata": {"confidence": "low"}},
            {"input": "Absolutely terrible customer service.", "output": "negative", "metadata": {"confidence": "high"}},
        ],
        TaskType.qa: [
            {"input": "What is the capital of France?", "output": "Paris is the capital of France.", "metadata": {"difficulty": "easy"}},
            {"input": "Why does inflation affect purchasing power?", "output": "Inflation reduces purchasing power because each unit of currency buys fewer goods over time.", "metadata": {"difficulty": "medium"}},
            {"input": "How should companies handle data breaches?", "output": "Companies should contain the breach, notify users, and report to regulators.", "metadata": {"difficulty": "hard"}},
        ],
        TaskType.summarization: [
            {"input": "The quarterly earnings report revealed a significant increase in revenue driven by strong performance in the cloud computing division. Operating costs remained stable while customer acquisition rates improved by 23% year-over-year.", "output": "Q3 earnings showed strong revenue growth led by cloud services with 23% better customer acquisition.", "metadata": {"compression_ratio": "high"}},
        ],
        TaskType.ner: [
            {"input": "Apple CEO Tim Cook announced a new partnership with Microsoft in Seattle.", "output": [{"entity": "Apple", "label": "ORG"}, {"entity": "Tim Cook", "label": "PERSON"}, {"entity": "Microsoft", "label": "ORG"}, {"entity": "Seattle", "label": "LOC"}], "metadata": {"entity_count": 4}},
        ],
        TaskType.intent: [
            {"input": "I want to cancel my subscription immediately", "output": "cancel_order", "metadata": {"confidence": "high"}},
            {"input": "Where is my package?", "output": "check_status", "metadata": {"confidence": "high"}},
            {"input": "Can you help me understand my bill?", "output": "get_support", "metadata": {"confidence": "medium"}},
        ],
    }

    base = mock_map.get(req.task_type, [{"input": "Sample input", "output": "Sample output", "metadata": {}}])
    samples = []
    for i in range(req.num_samples):
        item = base[i % len(base)]
        samples.append(DataSample(
            id=i + 1,
            input=item["input"],
            output=item["output"],
            metadata=item.get("metadata", {}),
        ))
    return samples

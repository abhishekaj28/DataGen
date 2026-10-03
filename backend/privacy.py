"""Regex-based detection and redaction of common personal identifiers.

This is a best-effort safety net for generated text. It finds emails, phone numbers, Aadhaar-style
numbers, PAN numbers and payment card numbers (Luhn-checked). It does NOT detect names, addresses
or other free-form personal data, and it gives no privacy guarantee.
"""
import re
from typing import Any, Callable, Dict, List

_PATTERNS: Dict[str, re.Pattern] = {
    "email": re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"),
    "phone": re.compile(r"(?<!\d)(?:\+91[\s-]?|0)?[6-9]\d{9}(?!\d)|(?<!\w)\+\d{1,3}[\s-]?\d{6,12}(?!\d)"),
    "aadhaar": re.compile(r"(?<!\d)\d{4}[\s-]\d{4}[\s-]\d{4}(?!\d)"),
    "pan": re.compile(r"\b[A-Z]{5}\d{4}[A-Z]\b"),
}
_CARD = re.compile(r"(?<!\d)(?:\d[ -]?){13,19}(?!\d)")


def _luhn_ok(number: str) -> bool:
    digits = [int(c) for c in number if c.isdigit()]
    if not 13 <= len(digits) <= 19:
        return False
    total = 0
    for i, d in enumerate(reversed(digits)):
        if i % 2 == 1:
            d *= 2
            if d > 9:
                d -= 9
        total += d
    return total % 10 == 0


def _card_matches(text: str):
    return [m for m in _CARD.finditer(text) if _luhn_ok(m.group())]


def detect_pii(text: str) -> List[str]:
    """Return the sorted list of PII kinds found in the text."""
    if not isinstance(text, str):
        return []
    kinds = {name for name, pattern in _PATTERNS.items() if pattern.search(text)}
    if _card_matches(text):
        kinds.add("card")
    return sorted(kinds)


def redact_text(text: str) -> str:
    if not isinstance(text, str):
        return text
    # cards first so their digits are not partly consumed by the phone pattern
    for m in reversed(_card_matches(text)):
        text = text[:m.start()] + "[REDACTED_CARD]" + text[m.end():]
    for name, pattern in _PATTERNS.items():
        text = pattern.sub(f"[REDACTED_{name.upper()}]", text)
    return text


def map_strings(obj: Any, fn: Callable[[str], str]) -> Any:
    """Apply fn to every string inside nested lists/dicts."""
    if isinstance(obj, str):
        return fn(obj)
    if isinstance(obj, list):
        return [map_strings(x, fn) for x in obj]
    if isinstance(obj, dict):
        return {k: map_strings(v, fn) for k, v in obj.items()}
    return obj


def collect_strings(obj: Any) -> str:
    """All strings inside obj joined by newlines (used to scan structured outputs such as NER)."""
    parts: List[str] = []
    map_strings(obj, lambda t: parts.append(t) or t)
    return "\n".join(parts)

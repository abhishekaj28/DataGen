from backend.privacy import detect_pii, redact_text


def test_detects_email_and_indian_mobile():
    kinds = detect_pii("Contact me at jane.doe@example.com or 9876543210.")
    assert kinds == ["email", "phone"]


def test_detects_aadhaar_style_and_pan():
    assert "aadhaar" in detect_pii("My number is 1234 5678 9012")
    assert "pan" in detect_pii("PAN: ABCDE1234F")


def test_card_numbers_need_a_valid_luhn_checksum():
    assert "card" in detect_pii("Card 4111 1111 1111 1111 expires soon")
    assert "card" not in detect_pii("Order id 4111 1111 1111 1112")


def test_plain_text_has_no_pii():
    assert detect_pii("The delivery arrived two days late and the box was damaged.") == []


def test_redaction_replaces_values():
    out = redact_text("Mail jane@example.com, call 9876543210, card 4111111111111111")
    assert "jane@example.com" not in out and "9876543210" not in out and "4111111111111111" not in out
    assert "[REDACTED_EMAIL]" in out and "[REDACTED_PHONE]" in out and "[REDACTED_CARD]" in out

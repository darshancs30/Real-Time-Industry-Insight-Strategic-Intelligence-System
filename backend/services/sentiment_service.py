from typing import Tuple


def analyze_sentiment(text: str) -> Tuple[str, float]:
    """Stub sentiment analysis returning simple polarity and confidence."""
    normalized = text.lower()
    positive_words = ["grow", "gain", "strong", "praise", "positive", "innovation", "launch"]
    negative_words = ["downturn", "warning", "concern", "challenge", "disrupt", "impact"]

    if any(word in normalized for word in positive_words):
        return "POSITIVE", 0.85
    if any(word in normalized for word in negative_words):
        return "NEGATIVE", 0.75
    return "NEUTRAL", 0.45

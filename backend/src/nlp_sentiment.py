import pandas as pd

# Lazy-load the transformer to avoid slow startup on every import
_pipeline = None

def _get_pipeline():
    global _pipeline
    if _pipeline is None:
        try:
            from transformers import pipeline
            _pipeline = pipeline(
                "sentiment-analysis",
                model="distilbert-base-uncased-finetuned-sst-2-english",
            )
        except Exception as e:
            print(f"[NLP] Could not load transformer pipeline: {e}")
            _pipeline = None
    return _pipeline


def analyze_review_trust(text: str) -> float:
    """
    Runs sentiment analysis on a review summary string.
    Returns a trust score between 0.0 (negative) and 1.0 (positive).
    Falls back to 0.5 (neutral) if the model is unavailable or text is empty.
    """
    if not text or (isinstance(text, float) and pd.isna(text)):
        return 0.5
    if text.strip() in ("", "General hospital.", "N/A"):
        return 0.5

    pipe = _get_pipeline()
    if pipe is None:
        return 0.5  # model not available — return neutral

    try:
        result = pipe(text[:512])[0]
        score = result["score"]
        return score if result["label"] == "POSITIVE" else (1.0 - score)
    except Exception:
        return 0.5


def batch_analyze(texts: list) -> list:
    """
    Runs sentiment on a list of review strings.
    Returns a list of float scores in the same order.
    """
    return [analyze_review_trust(t) for t in texts]
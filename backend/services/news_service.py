import pandas as pd


def fetch_news(query: str, limit: int, start_date=None, end_date=None) -> pd.DataFrame:
    """Stub implementation for fetching news articles."""
    columns = ["title", "publishedAt", "source", "url"]
    return pd.DataFrame([], columns=columns)

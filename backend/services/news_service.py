import pandas as pd
from datetime import datetime, timedelta


def fetch_news(query: str, limit: int, start_date=None, end_date=None) -> pd.DataFrame:
    """Stub implementation for fetching news articles with example data."""
    summaries = [
        f"{query.title()} adoption continues to grow across global markets.",
        f"Analysts warn of a possible downturn in {query} stocks.",
        f"New regulations may impact {query} supply chains.",
        f"Investors praise strong earnings from major {query} companies.",
        f"Surveys show positive sentiment around {query} innovation.",
        f"Operational disruptions cause concern in {query} logistics.",
        f"New product launches drive excitement in {query} technology.",
        f"Unexpected challenges emerge for the {query} sector this quarter.",
    ]

    records = []
    now = datetime.utcnow()
    for i in range(min(limit, len(summaries))):
        record = {
            "title": summaries[i],
            "publishedAt": (now - timedelta(hours=i * 6)).isoformat() + "Z",
            "source": f"Example Source {i + 1}",
            "url": f"https://example.com/{query.replace(' ', '-')}-{i + 1}",
        }
        records.append(record)

    return pd.DataFrame(records)

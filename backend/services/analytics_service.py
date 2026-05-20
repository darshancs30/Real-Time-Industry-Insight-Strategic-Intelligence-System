from typing import Dict
import pandas as pd


def compute_kpis(news_df: pd.DataFrame) -> Dict[str, object]:
    return {
        "total_articles": len(news_df),
        "average_score": float(news_df["score"].mean()) if "score" in news_df.columns and len(news_df) > 0 else 0.0,
        "distribution": {},
    }


def get_top_articles(news_df: pd.DataFrame) -> Dict[str, list]:
    return {
        "top_positive_articles": [],
        "top_negative_articles": [],
    }

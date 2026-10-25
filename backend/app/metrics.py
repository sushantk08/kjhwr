import numpy as np
import pandas as pd


def compute_metrics(df: pd.DataFrame) -> dict:
    # MAE, RMSE and bias (forecast minus actual, in MW). Rows with no actual are ignored.
    valid = df.dropna(subset=["forecast", "actual"])
    if valid.empty:
        return {"count": 0, "mae": None, "rmse": None, "bias": None}

    error = valid["forecast"] - valid["actual"]
    return {
        "count": int(len(valid)),
        "mae": float(error.abs().mean()),
        "rmse": float(np.sqrt((error ** 2).mean())),
        "bias": float(error.mean()),  
    }


def metrics_by_day(df: pd.DataFrame) -> list:
    valid = df.dropna(subset=["forecast", "actual"])
    return [
        {"day": day, **compute_metrics(group)}
        for day, group in valid.groupby("delivery_day")
    ]


def metrics_by_horizon(df: pd.DataFrame, bucket_hours: int = 6) -> list:
    # Accuracy grouped by how many hours ahead the forecast was published.
    valid = df.dropna(subset=["forecast", "actual"])
    valid = valid.assign(
        bucket_start=(valid["horizon_hours"] // bucket_hours * bucket_hours).astype(int)
    )
    return [
        {"horizon": f"{start}-{start + bucket_hours}h", **compute_metrics(group)}
        for start, group in valid.groupby("bucket_start")
    ]


if __name__ == "__main__":
    from app.processing import build_dataset

    data = build_dataset()
    print("Overall:", compute_metrics(data))
    print("By horizon:")
    for row in metrics_by_horizon(data):
        print(" ", row)
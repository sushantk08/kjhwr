import pandas as pd

from app.metrics import compute_metrics


def test_metrics_values():
    df = pd.DataFrame({"forecast": [110.0, 120.0], "actual": [100.0, 100.0]})
    result = compute_metrics(df)
    assert result["count"] == 2
    assert result["mae"] == 15.0
    assert result["bias"] == 15.0  
    assert round(result["rmse"], 2) == 15.81


def test_metrics_bias_cancels_out():
    df = pd.DataFrame({"forecast": [110.0, 90.0], "actual": [100.0, 100.0]})
    result = compute_metrics(df)
    assert result["mae"] == 10.0
    assert result["bias"] == 0.0


def test_metrics_ignore_missing_actuals():
    df = pd.DataFrame({"forecast": [110.0, 200.0], "actual": [100.0, None]})
    result = compute_metrics(df)
    assert result["count"] == 1
    assert result["mae"] == 10.0


def test_metrics_empty():
    df = pd.DataFrame({"forecast": [100.0], "actual": [None]})
    assert compute_metrics(df)["count"] == 0
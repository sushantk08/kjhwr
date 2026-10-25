import json
from datetime import date
from pathlib import Path

from app.elexon import fetch_actuals, fetch_forecasts

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def main():
    DATA_DIR.mkdir(exist_ok=True)

    # Decisions are made in January 2026, so delivery days run up to 1 Feb 2026.
    print("Fetching actuals...")
    actuals = fetch_actuals(date(2026, 1, 1), date(2026, 2, 2))
    (DATA_DIR / "actuals.json").write_text(json.dumps(actuals))
    print(f"Saved {len(actuals)} actual rows")

    print("Fetching forecasts...")
    forecasts = fetch_forecasts(date(2026, 1, 1), date(2026, 1, 31))
    (DATA_DIR / "forecasts.json").write_text(json.dumps(forecasts))
    print(f"Saved {len(forecasts)} forecast rows")

    print("Sample actual:", actuals[0] if actuals else None)
    print("Sample forecast:", forecasts[0] if forecasts else None)


if __name__ == "__main__":
    main()
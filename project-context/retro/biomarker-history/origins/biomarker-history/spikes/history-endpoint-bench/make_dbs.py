"""Seed copy, and a padded copy where user-1 has 50 draws (seed draws re-dated)."""

import shutil
import sys
from datetime import datetime, timedelta
from pathlib import Path

from app.models import ResultsDocument
from app.store import Store

out = Path(sys.argv[1])
shutil.copy("dev.db", out / "seed.db")
shutil.copy("dev.db", out / "padded.db")

store = Store(out / "padded.db")
seed = [d for _, d in store.query("results:user-1", ResultsDocument)]
start = datetime(2020, 1, 1, 9)
batch = []
for i in range(50 - len(seed)):
    tested_at = (start + timedelta(days=30 * i)).isoformat()
    draw = seed[i % len(seed)].model_copy(update={"tested_at": tested_at})
    batch.append(("results:user-1", tested_at, draw))
store.put_many(batch)
print(len(list(store.keys("results:user-1"))), "draws for user-1 in padded.db")

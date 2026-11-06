# BT5110 — betting matchup redesign

Design work for Task 3 of the Tour de France dashboard (Group 31).

## Contents

| Path | What it is |
|---|---|
| `docs/betting-matchup-spec.md` | Design spec: matchup view, market views, implied price, grading coverage |
| `docs/er-diagram.pdf` / `.png` | Task 1 ER diagram (Chen notation, BT5110 L3 conventions) |
| `scripts/profile_data.py` | Re-runnable data checks behind the spec |
| `data/` (repo root) | The three source CSVs, already in the repo |

## Run the data checks

```bash
pip install pandas
python scripts/profile_data.py --data-dir data
```

## The finding that matters

Head-to-head comparisons must settle on `rank`, **not** adjusted time.

On mass-start stages the peloton is credited one shared finishing time:
stage 3 gives all 181 finishers the same time, stage 21 gives 158 of 160.
Across the race, **20.3% of all pair-stage comparisons are exact ties on
adjusted time**.

Settled on time, Pogačar appears to lose to Vingegaard 9–21 and to be
winless on every flat stage. Settled on rank, he wins 18 of 21.

`scripts/profile_data.py` reproduces this.

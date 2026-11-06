#!/usr/bin/env python3
"""
BT5110 Tour de France - data profiling checks.

Reproduces the findings behind the betting-matchup design spec.
Most important: head-to-head must settle on `rank`, not adjusted time,
because the peloton shares one credited time on mass-start stages.

Usage:
    python scripts/profile_data.py --data-dir data/
"""
import argparse
import sys
from pathlib import Path

import pandas as pd


def load(data_dir: Path):
    results = pd.read_csv(data_dir / "individual_results.csv")
    riders = pd.read_csv(data_dir / "riders.csv")
    exits = pd.read_csv(data_dir / "exits.csv")

    days = sorted(results["day"].unique())
    stage_no = {d: i + 1 for i, d in enumerate(days)}
    results["stage"] = results["day"].map(stage_no)
    results["adj"] = results["time"] - results["bonus"] + results["penalty"]
    return results, riders, exits


def check_integrity(results, riders, exits):
    print("=" * 62)
    print("INTEGRITY")
    print("=" * 62)
    dupes = results.duplicated(["stage", "rider"]).sum()
    print(f"  duplicate rider-stage rows        : {dupes}")

    violations = []
    for _, e in exits.iterrows():
        after = results[(results["rider"] == e["bib"]) & (results["stage"] >= e["stage"])]
        if len(after):
            violations.append((e["bib"], e["name"], e["stage"]))
    print(f"  exit-rule violations              : {len(violations)}")
    for v in violations:
        print(f"      bib {v[0]} {v[1]} exited at stage {v[2]} but has later results")

    no_result = set(riders["bib"]) - set(results["rider"])
    print(f"  registered riders with no result  : {len(no_result)} {sorted(no_result)}")
    print()


def check_ties(results):
    """The headline finding: time ties make time-based head-to-head meaningless."""
    print("=" * 62)
    print("WHY HEAD-TO-HEAD MUST USE rank, NOT adjusted time")
    print("=" * 62)
    tied = total = 0
    for _, g in results.groupby("stage"):
        counts = g["adj"].value_counts().values
        tied += int((counts * (counts - 1) // 2).sum())
        n = len(g)
        total += n * (n - 1) // 2
    print(f"  pair-stage comparisons tied on adjusted time: "
          f"{tied:,} of {total:,} = {tied / total * 100:.1f}%")
    print()
    print("  largest group of riders sharing one finish time, per stage:")
    for s, g in results.groupby("stage"):
        biggest = g["time"].value_counts().iloc[0]
        flag = "  <-- whole peloton" if biggest / len(g) > 0.8 else ""
        print(f"      stage {s:2d}  {g['type'].iloc[0]:22s} "
              f"{biggest:3d}/{len(g):3d}{flag}")
    print()


def head_to_head(results, bib_a, bib_b, types=None, key="rank"):
    a = results[results["rider"] == bib_a]
    b = results[results["rider"] == bib_b]
    if types:
        a, b = a[a["type"].isin(types)], b[b["type"].isin(types)]
    m = a.merge(b, on="stage", suffixes=("_a", "_b"))
    if m.empty:
        return None
    wins = int((m[f"{key}_a"] < m[f"{key}_b"]).sum())
    ties = int((m[f"{key}_a"] == m[f"{key}_b"]).sum())
    n = len(m)
    # Laplace (add-one) correction: avoids p=1.0 on tiny samples and p=0 div-by-zero
    prob = (wins + 1) / (n + 2)
    return {"wins": wins, "ties": ties, "stages": n,
            "prob": prob, "price": 1 / prob}


def demo_matchups(results, riders):
    print("=" * 62)
    print("MATCHUP COMPARISON: time vs rank")
    print("=" * 62)
    name = dict(zip(riders["bib"], riders["rider_name"]))
    terrains = [("all", None), ("flat", ["flat"]), ("mountain", ["mountain"]),
                ("ITT", ["individual time-trial"])]
    for a, b in [(1, 11), (131, 111)]:
        print(f"\n  {name.get(a, a)} vs {name.get(b, b)}")
        print(f"      {'terrain':10s} {'by time':>16s} {'by rank':>16s} {'price':>8s}")
        for label, t in terrains:
            bt = head_to_head(results, a, b, t, key="adj")
            br = head_to_head(results, a, b, t, key="rank")
            if br is None:
                continue
            print(f"      {label:10s} "
                  f"{bt['wins']:3d}W {bt['ties']:2d}T /{bt['stages']:2d}    "
                  f"{br['wins']:3d}W {br['ties']:2d}T /{br['stages']:2d}    "
                  f"{br['price']:8.2f}")
    print()


def stage_mix(results):
    print("=" * 62)
    print("STAGE MIX  (caps every terrain-filtered sample)")
    print("=" * 62)
    stages = results.drop_duplicates("stage")
    for t, g in stages.groupby("type"):
        print(f"  {t:24s} {len(g):2d} stages")
    print()
    ridden = results.groupby("rider").size()
    print(f"  riders completing all 21 : {(ridden == 21).sum()} of {len(ridden)}")
    print(f"  bonus rows               : {(results['bonus'] > 0).sum()}")
    print(f"  penalty rows             : {(results['penalty'] > 0).sum()}"
          "   <-- too few for its own control")
    print()


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--data-dir", default="data", type=Path)
    args = p.parse_args()

    if not args.data_dir.exists():
        sys.exit(f"data dir not found: {args.data_dir}")

    results, riders, exits = load(args.data_dir)
    check_integrity(results, riders, exits)
    check_ties(results)
    demo_matchups(results, riders)
    stage_mix(results)


if __name__ == "__main__":
    main()

# Le Tour Lab — Betting Matchup Design Spec (BT5110 Task 3)

Nov 6, 2026

A rider-vs-rider matchup becomes the dashboard's landing view, framed as a
trading desk's pre-market research tool. Three further market views sit behind
it, because three of the five Task 3 grading criteria live there. Every number
shown is computed in SQL from settled 2025 results; nothing is forecast and
nothing is simulated.

## The frame

The dashboard is the research tool a trading desk uses **before** it prices a
market, not the betting product itself. The user is the analyst setting the
odds, not the punter placing a bet.

This matters because the data cannot support anything else. One edition,
settled results, no odds, no stakes, no prior-year form. There is nothing in it
to forecast from, so the dashboard reports what happened and never predicts
what will.

What the frame changes: landing view, section titles, narration. What it does
not change: the SQL, the measures, the existing views. The project's current
discipline — *Proxies clearly labelled · All calculations in SQL* — is the
thing that earns marks, and the frame is built to preserve it rather than spend
it.

One line stays visible on the matchup view: **Settled 2025 results. Historical
frequency, not a forecast.**

## The matchup view

An upgrade of the existing Head to head view, promoted to the landing route.
Three zones.

**Left rail — the parameters.** Everything here narrows the set of stages the
verdict is computed over, so every control visibly moves the numbers on screen.
That is the drill-down criterion demonstrating itself.

| Control | Source | Note |
| --- | --- | --- |
| Stage | terrain → stage → start/finish city | three-level drill path, already in the schema |
| Age band | derived from dob | the derived attribute from Task 1, earning its place |
| Penalty / bonus | time_penalty, time_bonus | toggles, reusing the E7 counterfactual logic |
| Bike manufacturer | team sponsor, to be added | one column on team; see the data section |
| Team, nation | existing | already in the global filter bar |

**Centre — the verdict.** Rider A card, verdict panel, Rider B card. The panel
carries four things, all computed over the filtered stage set:

- Head-to-head record — *beat B on 12 of 18 shared stages*
- Implied probability and implied price — see below
- Median time gap, and how it moves as the terrain filter changes
- Shared-stage count, shown always

**Below — the per-stage trace.** The stage-by-stage line you already draw, each
point marked as a win or loss for A. Clicking a stage drills into that stage's
full result, so the matchup hands off to the rest of the dashboard rather than
dead-ending.

Add a search box to both rider pickers. They are currently flat lists of
roughly 180 names, and under a matchup frame this is the control people touch
most.

## The implied price

This is the betting-native number, and it is honest because it is nothing more
than an observed frequency restated in odds notation.

Head-to-head is settled on **rank**, never on adjusted time. This is the single
most important correction in this spec and the data notes below show why. Over
the stages both riders completed within the current filters:

```
implied probability = (stages A outranked B + 1) / (stages both completed + 2)
implied price       = 1 / implied probability
```

The +1 and +2 are an add-one (Laplace) correction, and they are not cosmetic.
Without them, Pogačar beating Vingegaard on both time trials reads as 2 of 2 →
probability 1.000 → **price 1.00**, a claim of certainty from two stages; and a
0-of-7 record divides by zero outright. With the correction, 2 of 2 gives 1.33
and 0 of 7 gives 9.00. Worked example on the real data: Pogačar outranks
Vingegaard on 18 of 21 stages, so (18+1) / (21+2) = 0.826, shown as **1.21**.

A bookmaker would then add margin; you do not, and saying so in the demo is the
point — it shows you know what a real price contains that yours does not.

Three rules keep it defensible:

- Show the shared-stage count beside every price, always. Do **not** set an
  eight-stage minimum: a terrain filter leaves at most 7 stages (flat 7,
  hilly 6, mountain 6, ITT 2), so that threshold would grey out every terrain
  view. Label thin samples instead of hiding them.
- Call it *implied price*, never *odds we offer* or *value*. The first
  describes the data; the others claim a market exists.
- The SQL stays behind a Show SQL button, as everywhere else.

## Data notes from the three CSVs

Checked against riders.csv (184 rows), individual_results.csv (3,602 rows) and
exits.csv (24 rows). The data is clean: no duplicate rider-stage rows, and zero
exit-rule violations — every rider who exits at stage S has no result from S
onward, exactly as the specification requires.

**Why head-to-head must use rank.** On mass-start stages the whole peloton is
credited the same finishing time. Stage 3 gives all 181 finishers an identical
time; stage 21 gives 158 of 160; stage 17 gives 140 of 164. Across every
pair-stage comparison in the race, **20.3% are exact ties on adjusted time**.

| Pogačar vs Vingegaard | By adjusted time | By rank |
| --- | --- | --- |
| All 21 stages | 9 wins, 11 ties | 18 wins, 0 ties |
| Flat stages only | 0 wins, 7 ties | 5 wins, 0 ties |
| Mountain stages | 4 wins, 1 tie | 5 wins, 0 ties |

Settled on time, Pogačar appears to *lose* the matchup 9–21 and to be winless
on every flat stage. Settled on rank, he wins 18 of 21. The specification says
rank exists to capture crossing order, and this is why it has to be the field
the verdict reads.

**Other facts worth knowing before building**

| Fact | Value | Consequence |
| --- | --- | --- |
| Stages by type | flat 7, hilly 6, mountain 6, ITT 2 | Caps every terrain-filtered sample |
| Riders completing all 21 | 160 of 182 | Most pairs share 21 stages |
| Pairs sharing under 8 stages | 6.5% | Thin samples are the exception |
| Registered with no result | 2 (Ganna, Bissegger) | Both exited at stage 1; exclude from pickers |
| Stage bonuses awarded | 57 rows | Enough to make the counterfactual move |
| Penalties awarded | 4 rows | Too few for its own control — fold into the toggle |
| Rider country missing | 1 rider (Vlasov, NULL) | Decide a label before the nations view counts it |

## Grading coverage

The matchup view alone fails three of the five criteria. This is why the market
views exist alongside it: the betting frame is the front door, not a
replacement for the house.

| Task 3 criterion | Earned by | Betting framing |
| --- | --- | --- |
| a. Drill-down | Matchup left rail; Pivot explorer | Narrowing the market: terrain → stage → city |
| b. Classification comparison | Four markets, one race | Same rider, four markets, four prices |
| c. Aggregate performance | The board; Pivot explorer | Pricing the whole field on cumulative time |
| d. Country participation | Where the field comes from | Market composition by nation |
| e. Design and presentation | Whole dashboard | Matchup as landing view carries the story |

The Pivot explorer is the strongest asset for (a) and (c) and should not be
buried under the new landing view. Five user-chosen dimension levels with
ROLLUP subtotals is a genuine OLAP engine. Keep it one click from the matchup,
framed as *build your own angle*.

Demo order covering all five without doubling back: the board (c, e) → zoom
into one matchup (a, e) → drill into a stage (a) → four markets (b) → field
composition (d) → Pivot explorer as the open-ended close (a, c).

## The market views

The E1–E15 prompts are a library of examples, not a checklist, so the views
below are designed from the betting frame instead of mapped onto them.

**The board — price the whole field.** The GC standings restated as a market:
every rider, cumulative adjusted time, and an implied price derived the same
way as in the matchup. This is the view a desk opens first. Covers aggregate
performance (c), and it makes the matchup feel like a zoom into one row.

**Four markets, one race.** GC, points, King of the Mountains and young rider
side by side, with each rider's position in all four. A rider cheap in one
market and expensive in another is where a desk looks for mispricing. This is
criterion (b).

**Where the field comes from.** Teams and riders by nation, framed as market
composition. This is criterion (d), and it is the weakest fit with the betting
story, so keep it short.

**Carried over:** the Pivot explorer as *build your own angle*; the
bonus/penalty counterfactual, wired into the verdict panel; the stage detail
view the matchup drills into.

Four views total, plus the pivot — fewer than the eight now. The cut is
deliberate: four purposeful screens demo better than eight competent ones, and
criterion (e) rewards a layout that reads as designed rather than assembled.

## Weather and bike manufacturer

**Bike manufacturer — add it, with one caveat.** One column on team, roughly
ten brands across twenty-three teams. Real, sourceable, cheap.

The caveat: brand is a team attribute, so all eight UAE riders are Colnago and
all eight Visma are Cervélo. Brand is a coarser grouping of team, not an
independent variable, and no query can separate a brand effect from a team
effect. Use it as a drill dimension and say so in the write-up.

**Weather — use real data, not random.** Randomly assigned rain would produce
statements like *on wet stages A beats B seven times in ten*, which reads as a
finding, sits beside SQL-computed figures, and is in fact a readout of a random
number generator. That single move would make *All calculations in SQL* untrue.

You do not need to fake it. Twenty-one stages, known dates (5–27 July 2025),
known finish cities. Historical precipitation for those date-location pairs is
freely available from an open archive API with no key. That gives a
stage_weather table joined on stage_id.

If the group would rather not add the data, the toggle has to change what it
claims: make it a **scenario assumption** the user sets — *assume wet
conditions cut the sprinter advantage by X%* — and show how the implied price
moves under that stated belief. The number is then explicitly the user's input,
labelled an assumption.

What it cannot be is a generated column presented as a dimension you analyse.

**Schema drift.** Task 2 was submitted on 12 October. Adding either field means
the Task 4 report carries an ER diagram and schema that no longer match the
dashboard. Either amend both and flag the change, or document them as a
declared post-submission extension — but decide deliberately.

## Build order and open decisions

Ordered so the demo works even if the last items never ship.

1. Promote Head to head to the landing route and rename it. Reframe copy.
2. Build the verdict panel: record, implied probability and price, median gap,
   shared-stage count.
3. Wire the left rail to filter the verdict — stage drill path first.
4. Add rider search to both pickers.
5. Hook the existing bonus/penalty toggles into the verdict panel.
6. Add age band.
7. Add bike manufacturer, if the group accepts the schema-drift note.
8. Add real stage weather, if the group wants the rain filter.

Steps 1–5 are a complete, defensible submission on their own.

**Decisions for the group**

- [ ] Does the betting frame go in the Task 4 report, or only the live demo?
- [ ] Bike manufacturer: add it, or leave the schema matching Task 2?
- [ ] Weather: real data, scenario assumption, or drop it?
- [ ] How to label a thin-sample price

**One fix regardless.** The shared link currently carries `?nation=FRA`, so it
opens filtered to 38 riders and one nation. Strip the filter before the URL
goes in the report or the demo.

# Demo script — BT5110 Group 31

Open the deployed root URL (or the local Vite URL), then choose **Demo tour**. The tour menu jumps to any E1–E15 scenario in one choice after opening the tour (two clicks total). Use ← / → while focus is outside an input/select/button; Escape leaves the tour. The menu and previous/next buttons always work by keyboard as ordinary controls. Each step resets filters to a known state encoded in the URL.

## E1. A pivotal day

- Clicks: Demo tour → step menu → E1 (at most three clicks).
- Talking point: Pogacar’s Stage 12 time was 206.5 seconds faster than the final top-ten median. Follow the stage trace to explain the difference.
- Direct hash: `#/rider?demo=0`.

## E2. A stage in focus

- Clicks: Demo tour → step menu → E2 (at most three clicks).
- Talking point: Explore Stage 8. Jonathan Milan crossed first, but his penalty gave Wout Van Aert the lowest adjusted time.
- Direct hash: `#/stages?stage=8&demo=1`.

## E3. Team contribution

- Clicks: Demo tour → step menu → E3 (at most three clicks).
- Talking point: The team award counts the three fastest riders each day. The workload roll-up is shown separately; drill from team to rider to stage.
- Direct hash: `#/teams?team=TEAM+VISMA+%7C+LEASE+A+BIKE&demo=2`.

## E4. Parallel classifications

- Clicks: Demo tour → step menu → E4 (at most three clicks).
- Talking point: Compare GC, Young Rider and the two clearly labelled proxies. A different rank reflects a different objective.
- Direct hash: `#/classifications?demo=3`.

## E5. Mountain contours

- Clicks: Demo tour → step menu → E5 (at most three clicks).
- Talking point: Compare the selected rider’s mountain podiums with their mean gap to each stage winner.
- Direct hash: `#/rider?types=mountain&rider=11&demo=4`.

## E6. When the terrain changes

- Clicks: Demo tour → step menu → E6 (at most three clicks).
- Talking point: Speed is summed distance divided by summed time. Terrain indices compare performance against finisher benchmarks.
- Direct hash: `#/teams?demo=5`.

## E7. Replay the race

- Clicks: Demo tour → step menu → E7 (at most three clicks).
- Talking point: Removing both adjustments gives 0 final position changes. Move the end-stage control to 1–4 to see a different leader.
- Direct hash: `#/classifications?noBonus=true&noPenalty=true&demo=6`.

## E8. Who is represented?

- Clicks: Demo tour → step menu → E8 (at most three clicks).
- Talking point: France has 38 riders but five teams. Switch the nationality basis, then drill into the country’s riders.
- Direct hash: `#/nations?demo=7`.

## E9. National outcomes

- Clicks: Demo tour → step menu → E9 (at most three clicks).
- Talking point: Inspect French wins, podiums and best final GC rank, then follow the supporting rider and stage links.
- Direct hash: `#/nations?nation=FRA&demo=8`.

## E10. The GC storyline

- Clicks: Demo tour → step menu → E10 (at most three clicks).
- Talking point: Read gaps to the daily leader. Mountain shading connects the changes to the race terrain.
- Direct hash: `#/overview?demo=9`.

## E11. Against the clock

- Clicks: Demo tour → step menu → E11 (at most three clicks).
- Talking point: The ITT catalogue contains Stage 5 in Caen and Stage 13 to Peyragudes, with distances and winners.
- Direct hash: `#/stages?types=individual+time-trial&stage=5&demo=10`.

## E12. Consistency near the front

- Clicks: Demo tour → step menu → E12 (at most three clicks).
- Talking point: Pogacar finished in the top ten on 13 stages. Inspect the list and terrain of those finishes.
- Direct hash: `#/rider?demo=11`.

## E13. Squad depth

- Clicks: Demo tour → step menu → E13 (at most three clicks).
- Talking point: All squads registered eight riders. Finishers, riders with results and nationality counts reveal meaningful differences.
- Direct hash: `#/teams?demo=12`.

## E14. Top-ten intensity

- Clicks: Demo tour → step menu → E14 (at most three clicks).
- Talking point: Click a team–terrain heatmap cell to see the riders and stages behind its count.
- Direct hash: `#/teams?demo=13`.

## E15. The long day

- Clicks: Demo tour → step menu → E15 (at most three clicks).
- Talking point: Stage 2 is the longest at 209.1 km. Its route and leading finishers sit beside the stage catalogue.
- Direct hash: `#/stages?stage=2&demo=14`.

## X1. Demo controls

- Clicks: Demo tour → step menu → X1 (at most three clicks).
- Talking point: Use this menu to jump to any scenario in one click, or use the left and right arrow keys. Escape leaves the tour.
- Direct hash: `#/overview?demo=15`.

## X2. Show the SQL

- Clicks: Demo tour → step menu → X2 (at most three clicks).
- Talking point: Every chart and table exposes its executed SQL, measured query time and OLAP operation.
- Direct hash: `#/pivot?demo=16&sql=pivot`.

## X3. Share the view

- Clicks: Demo tour → step menu → X3 (at most three clicks).
- Talking point: Copy link includes every filter, selected rider, drill and demo step. Open it in a new tab to reproduce this view.
- Direct hash: `#/rider?types=mountain&rider=11&demo=17`.

## X4. Head to head

- Clicks: Demo tour → step menu → X4 (at most three clicks).
- Talking point: Compare any two riders on common stages. Time deltas and crossing-line win/loss counts answer different questions.
- Direct hash: `#/head-to-head?demo=18`.

## X5. Export the evidence

- Clicks: Demo tour → step menu → X5 (at most three clicks).
- Talking point: Use CSV on a table and PNG on a chart. Exports represent the current filtered query.
- Direct hash: `#/nations?demo=19`.

## X6. Theme and accessibility

- Clicks: Demo tour → step menu → X6 (at most three clicks).
- Talking point: Try the dark theme. Terrain labels and symbols preserve meaning without relying on colour.
- Direct hash: `#/overview?demo=20&theme=dark`.

## Demonstration finish

Use Show SQL to connect the visuals to the warehouse, export one table and one chart, and copy a deep link. If a selected rider disappears after a filter, explain the empty selection and use Clear all. Do not describe the proxies as official jersey rankings.

## Presentation checks

Before the presentation, run the real test/build/browser suite and inspect the screenshots. Load the hosted page once on the presentation machine; verify that the WASM assets are served and that the tour is readable at projector resolution. A static site still needs its initial files downloaded.

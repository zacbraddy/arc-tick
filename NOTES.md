# NOTES 📝

Hello 👋 Here's the short version. Task 1 (biomarker history) is done: there's a new `GET /api/biomarkers/{id}/history` endpoint, and each marker card has an inline chart that opens to show how that marker has moved over time. I had planned time to work on a "cherry on top" story which was to bring in considerations around accessibility but as my timebox ran out I have needed to leave that on the table. Although making accessibility take the hit doesn't feel great, I figure it's better to have delivered the working software than fail the whole task trying to add bells and whistles. Run steps, the data model and the storage API are all in the [README](README.md), so I won't repeat them here.

**Where the decision trail lives 🗺️:** I worked docs-first. The spike, data survey, plan, stories and their reviews were all written up as I went. They're archived out of the repo as the final step of the task, but stay in git history if you want the full story. Find the archive commit with `git log --oneline --grep 'retro: archive biomarker-history'`, then browse its parent, e.g. `git show <commit>^:project-context/retro/biomarker-history/`. The decisions that will matter beyond this task were kept in [`project-context/10k/`](project-context/10k/).

## Assumptions 🤔

The brief left a few things open. Below is what I picked and why. The first one shaped everything else, so it gets the most words.

- **History has its own endpoint, and `/api/home` is untouched.** The obvious move was to put history into the home payload. I benched that before committing to it. With one member padded to 50 draws, inlining every biomarker's history pushed `/api/home` to **55 ms** p95, well over the 35 ms budget 😬. With a separate endpoint, home stayed at **3.5 ms** and the history endpoint took **10.5 ms**. The separate endpoint is also the shape Task 2's wearable data would want, so the choice pays twice.
- **Each point is plotted against the reference ranges from its own draw, not today's.** Labs revise their ranges over time, and in the seed data ranges drift between draws for 6 of 30 biomarkers. Each result already stores the ranges that applied when it was drawn ([ADR 0002: draw results keep as-at-draw ranges](project-context/10k/technical/adrs/0002-draw-results-keep-as-at-draw-ranges.md)). So the chart's coloured bands step at each draw date instead of using the catalogue's current ranges, and the tooltip shows that draw's optimal range.
- **Each point's status (optimal / good / improve) is the status stored with it.** It isn't recalculated against later ranges, because that would rewrite what the member was told at the time.
- **Units aren't converted.** In the seed data each biomarker has one unit per member. Each point carries its own unit, and the tooltip shows it.
- **The chart opens inline under its marker card, not in a modal or on a separate page.** That keeps the latest value in view next to its history. The data is fetched lazily the first time the chart is opened.
- **A failed fetch (network error, expired session, unknown biomarker) shows its error message inside the chart panel.** Closing and reopening the panel retries.
- **No domain or service layer.** `app/routes/history.py` holds the route and one pure function, `history_points`, which filters and sorts a member's draws. One filter over one partition doesn't justify an extra layer yet.

### Edge cases and their guards 🛡️

The seed data is suspiciously tidy ✨. Every biomarker has at least two points, nothing is null, and every range has both ends. Real lab data won't stay that polite. I gave each likely failure one cheap check, without trying to build something bulletproof.

| Edge case | Guard |
|---|---|
| Unknown biomarker id | `biomarker_history` returns `404` (tested) |
| No results for this biomarker | `200` with empty `points` (tested); the UI shows "No history yet" |
| Single draw | `historyChartOptions` pads the x-axis ±30 days so the chart doesn't collapse to a line |
| Biomarker missing from some draws | `history_points` leaves those draws out (tested); the time-scaled x-axis keeps the gaps honest |
| Two draws on the same date | `history_points` sorts by `tested_at` and keeps both (tested) |
| A range band is one-sided, null or missing | `validBand` skips that band and the point still plots. The `Band` model already requires `min` and `max` at ingest, so this is belt and braces |
| Unit changes between draws | No conversion; each point's own unit is in its tooltip (known limit) |
| Value outside every band | `valueExtent` sizes the y-axis to cover both values and bands, so outliers aren't clipped |
| Another member's data | The read only touches the signed-in member's `results:{member_id}` partition (tested) |

The frontend guards were checked by hand and by reading the code, because there's no JS test harness (more on that under Left out).

## Storage layout 🗄️

Nothing new was added to the store. History reuses the partition the draws already live in, so the question was what reading it costs.

- History reads the member's whole `results:{member_id}` partition (one document per draw) and filters it in Python. That's cheap at the seed's 2–6 draws per member. The spike puts it at about 35 ms around 200 draws.
- `/api/home` doesn't change, so its 35 ms budget is protected however long a member's history grows.
- **Risk for Task 2:** if wearable data were written into the same `results:{member_id}` partition, every history read would pay to scan it. The plan is to give it its own partition (e.g. `wearables:{member_id}`) and reuse the per-series endpoint pattern.

To prove `/api/home` didn't regress, here's a fresh bench after the build (`scripts/bench.py --n 200`, seed `dev.db`). Comfortably under budget all round 🟢:

| Member | `/api/home` p95, serial | p95, 8 concurrent |
|---|---|---|
| james.chen | 2.9 ms | 28.2 ms |
| priya.raman | 3.0 ms | 31.8 ms |
| tom.okafor | 3.4 ms | 28.9 ms |
| sofia.marek | 3.0 ms | 27.7 ms |

For comparison, `/api/biomarkers/vitamin_d/history` (james.chen, serial) came in at 3.0 ms p95.

## Left out / next 🚧

The hour is a hard wall ⏰, and I'd rather hand over something that works end to end than something wider and wobbly. Here's what didn't make the cut, roughly in the order I'd pick it up:

- **Task 2 (wearables): not started.** Task 1 took the hour. Next would be shaping it around a separate partition and a per-series endpoint, as above.
- **Accessibility and polish extras: skipped to fit the time-box.** These were a screen-reader list as an alternative to the chart and pinning one-sided bands to the chart edge. Landing working core slices inside the hour came first.
- **No JS test harness.** The single-point, no-points and unit-change UI cases were checked by reading the code only.
- **No unit conversion.**
- **Read cost at scale.** Past a few hundred draws, index results by biomarker or keep a per-biomarker series instead of scanning the whole partition.

## AI usage 🤖

I paired with Claude Code for the whole task. Don't let that fool you though, I didn't vibe-bro my way to a solution! To complete the task I brought in my own custom AI software development workflow and ran through the problem. So every step left a written trail, which I was in charge of reviewing and steering to ensure that the result is a codebase I'm willing to put name to.

If you're interested at all in what my framework looks like it's all checked in under the `.claude/` folder so you can see if you'd like but at a high-level here is what the process looked like:

- A `project-context/` folder in the repo was the shared knowledge base. Every open question, established fact and decision was recorded there as the work went.
- The stages were:
  1. Idea and shaping: the API-shape bench spike and a survey of the seed data.
  2. Epic planning: thin vertical slices, architecture diagrams and a test plan.
  3. Per story: write it, implement it, then review it in a fresh session.
- Subagents gathered project context, checked whether each stage was ready to move on, and reviewed each implemented story.
- Implementation was test-first: a failing pytest came before each API behaviour.
- I reviewed, iterated on and committed every story myself. I also made the scope calls, including dropping the extras to land working slices inside the hour.

Thanks for reading 🙌

# Follow-ups from the biomarker-history retro

- **Screen-reader list of history points.** A visually hidden list (date, value, unit, status) in each history panel. About 5 lines in `loadHistory` plus a style. Closes the accessibility gap in TASK_1 ("a table alone is not sufficient" applies to the chart too).
- **Pin one-sided bands to the axis edge.** `validBand` skips them today. Low value until real data has one-sided ranges.
- **Task 2 shaping input (was u5).** TASK_2 requires the wearable chart data to come through `/api/home` within 35 ms p95. The question is how to fit 30 days × 3 metrics per member at about 1 ms of validation per document on home. Use a separate `wearables:{member_id}` partition so biomarker history reads don't pay for wearables. Note: `created_draw` in models is draw ingest, not evidence that wearables write to `results:{id}`.
- **Unit changes between draws.** Convert or flag them. Park this until real data shows the problem.

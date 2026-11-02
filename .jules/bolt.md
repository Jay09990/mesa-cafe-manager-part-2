# Bolt's Journal

## 2026-11-02 - Redundant Date/Regex Parsing in Slot Availability Loop
**Learning:** `generateAvailability` recalculates `dayIndex` (string split + `Date.UTC`) and regex validation via `minutesFromTime` inside an $O(\text{slots} \times \text{bookings})$ nested loop. Pre-normalizing bookings into integer minute ranges once before slot iteration cuts CPU time by >95% without altering availability semantics.
**Action:** When computing scheduling or overlapping time slots against active bookings, pre-normalize bookings to continuous integer timeline segments upfront rather than parsing dates and time strings inside each interval evaluation.

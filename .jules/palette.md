# Palette's Journal - Critical UX Learnings

## 2026-11-03 - Booking availability empty states and focus ring contrast
**Learning:** In public self-service booking flows with radio card selectors, hidden peer inputs (`peer sr-only`) require explicit focus-visible rings (`peer-focus-visible:ring-2`) on their visual labels so keyboard navigators can see the active choice. Additionally, when slots load successfully but return 0 available tables for the requested party size, an explicit empty-state message prevents users from assuming the form is stuck or broken.
**Action:** Always provide explicit guidance and `role="status"` when async filterable slot lists return zero choices, and verify keyboard focus indicators on customized radio buttons.

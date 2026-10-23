# debugging-prompt.md — Bug Fix / Change Request Template

Use this template whenever something breaks or you need a change made, mid-project. Fill in the bracketed parts each time.

---

**PROMPT TEMPLATE:**

There's an issue / change needed in Mesa:

**Problem/change description:** [describe exactly what's wrong, or exactly what you want changed — be specific: what you did, what happened, what you expected instead. Or for a change: what should be different and why]

**Where this likely lives:** [if you know — which module per modules.md, or which file/folder — otherwise say "not sure, please locate it"]

**Constraints:**
- Fix/implement this without affecting any other existing feature or functionality. If the fix requires touching shared code (e.g. something in `components/ui/` or `lib/`), stop and tell me what else might be affected before proceeding.
- Follow the existing patterns already established in `architecture.md`, `tools.md`, and `design.md`/`color-system.md` — do not introduce a new library, new folder pattern, or new color/style approach to solve this unless there's genuinely no way to do it within the existing system.
- If this touches tier-gating logic (per `billing/tier-config.ts`), double-check that the fix doesn't accidentally expose a higher-tier feature to a lower tier or vice versa.
- After fixing, briefly tell me what caused it (root cause, not just "fixed it") so I actually understand what happened.

---

*(Keep this prompt short and reusable — the value is in the constraints section staying constant every time, so the agent never "fixes" one thing by quietly breaking your architecture, tools, or design conventions elsewhere.)*
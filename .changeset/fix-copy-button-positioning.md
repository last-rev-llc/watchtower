---
"@last-rev/watchtower": patch
---

Fix copy button positioning on the `/api/healthcheck/test` page.

The button was positioned at `top: 10px; right: 10px` relative to
`.result-container`, which has `padding: 20px`. This placed the button
across the boundary of the light padding zone and the dark `<pre>` block,
so the top half rendered invisibly against the light background while the
bottom half sat on the dark code area — giving the appearance of a cut-off
button.

**Fix:**

- Offset the button to `top: 30px; right: 30px` so it sits cleanly 10px
  inside the dark `<pre>` block.
- Add `z-index: 1` to stay above any overflow/scroll chrome.
- Add `line-height: 1.2` for consistent emoji + text alignment.
- Add `:focus-visible` outline for keyboard accessibility.

---
doc: prd
status: draft
---

# Prompt Power-Up: Product Requirements

## The Core Journey
1. **Start:** the teen sees a headline ("Your prompt is your code"), a text box and the **Check my prompt** button.
2. **Type:** they enter a short idea, up to 300 characters, such as "make a quiz app".
3. **Score and ask:** the coach scores the 5 parts (0 = missing, 1 = vague, 2 = clear). It then asks one short question for each part that scored 0 or 1, in part order. That's 3–5 questions.
4. **Answer:** each question shows a sentence lead ("You are…", "It's for…", "Make it…") and 2–3 tappable example answers that fit this idea. The teen types their own answer or taps an example to fill the box.
5. **Watch the scorecard:** it fills in live as answers come in (⬜ → ✅).
6. **Power up:** the assembled prompt shows the original prompt, then each lead joined to the teen's answer. Nothing is invented.
7. **Compare:** two previews appear side by side, "😴 Your prompt" and "⚡ Powered up", each with a one-line explanation underneath.
8. **Keep it:** **Copy prompt** puts the powered-up prompt on the clipboard, and **Open Gemini** opens AI Studio in a new tab. **Try another idea** resets the page.

## Screens and Layout
There's one page with three stacked steps, and only the current step is active:
1. Your idea
2. Power-up questions, with the scorecard beside them on desktop and above them on a phone
3. Side-by-side results, which stack on a phone

## Look and Feel
Deep navy background, purple and lime accents, rounded cards, big tappable buttons and emoji labels. It reads clearly on a phone. It sounds friendly and short, like an older sibling.

## Features and Behavior
- **Scoring and questions:** one AI call that returns JSON: the scores, the questions (12 words or fewer), the leads and the examples.
- **No rewriting:** the client assembles the final prompt itself. The AI never returns prompt text.
- **Builds:** two AI calls run in parallel with **identical** builder instructions, so the prompt is the only difference. Each returns one self-contained HTML file.
- **Sandbox:** previews run in an `iframe` with `sandbox="allow-scripts"`, so there's no same-origin access, no forms and no pop-ups. Builder instructions forbid network requests, external files and collecting personal data.
- **Safety:** questions never ask for personal details. Inputs are length-limited.

## States and Boundaries
- **Loading:** an animated "Vibo is thinking…" message while scoring, and "Building both apps… 10–30 s" with a progress shimmer while building.
- **One build fails:** the other still shows, and the failed side says "This one didn't build, try again".
- **Both fail, or the scoring fails:** a friendly error and a retry button.
- **Empty prompt:** the button stays disabled.
- **No API key:** offline demo mode, with a visible banner, rule-based scoring and two sample apps.
- **All 5 parts already clear:** the coach praises the prompt and goes straight to building.

## Product Decisions
- The coach asks and never rewrites. This is the kernel.
- The builder instructions for both apps are identical, which keeps the comparison fair.
- It's open to anyone, with no sign-in for this proof of concept.

## What We're Building
The single page above, plus a tiny local server that keeps the Gemini key off the page.

## Deferred From the POC
Accounts, daily limits (`POWERUP_DAILY`), a server-side safety model, the dashboard, teacher review and publishing.

## Possible Later Enhancements
Saving the prompt to "My app", an X-ray of the powered-up app, and a class leaderboard of prompt scores.

## Non-Goals
A general chat assistant, and editing the generated app inside this tool.

## Open Questions
None blocking.

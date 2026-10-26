---
doc: spec
status: draft
---

# Prompt Power-Up: Technical Spec

## How This Works, In Plain Language
A web page talks to a tiny Node server on your computer. The server holds the Gemini API key and forwards three kinds of request to Gemini:
- "score this prompt and ask questions"
- "build an app from this prompt" (twice, in parallel)

The page puts the final prompt together itself and shows the two apps in locked-down frames.

## The Core Journey Through the System
1. The page sends `POST /api/coach {prompt}`. The server asks Gemini for JSON (scores, questions, leads, examples), checks it and returns it.
2. The page renders the questions and updates the scorecard locally as the teen types.
3. The page assembles the prompt: the original prompt plus each lead joined to an answer.
4. The page sends `POST /api/build {prompt}` twice in parallel, once with the original prompt and once with the assembled one. The server sends identical builder instructions plus the prompt to Gemini, then strips code fences and returns `{html, explain}`.
5. The page renders each result with `iframe srcdoc` and `sandbox="allow-scripts"`.

## Stack
- **Node 20, no dependencies:** the built-in `http` module and global `fetch`.
- **Plain HTML, CSS and JS** with no framework and no build step.
- **Gemini API** (`gemini-2.5-flash`, which can be changed with `GEMINI_MODEL`) over the REST `generateContent` endpoint, using JSON response mode for the coach call.

## Where It Runs and How Someone Tries It
1. Run `node server.js`.
2. Open http://localhost:3000.
3. The key goes in `.env` as `GEMINI_API_KEY`. Without it, the app runs in offline demo mode.

Deployment is optional and out of scope. The demo video is the proof.

## Look and Feel
These CSS variables live on `:root`:

| Variable | Value |
|---|---|
| `--bg` | `#0f1033` (navy) |
| `--card` | `#1b1d4d` |
| `--accent` | `#8b5cf6` (purple) |
| `--lime` | `#a3e635` |

Fonts are system UI, with rounded 16px cards and tap targets of at least 44px.

## Components
### server.js
- Static file server for `public/`.
- `/api/coach` and `/api/build`, with input caps (300-character idea, 2,000-character prompt) and a 60-second timeout.
- Offline fallback when there's no key.
### public/index.html, app.js, styles.css
- The three-step UI, the scorecard, prompt assembly, parallel builds, the copy button and the Gemini link.

## Data Model
There's no persistence. The in-memory page state holds:
- the idea
- the coach response: `parts[]`, each with `{key, score, question, lead, examples[]}`
- the answers
- the assembled prompt
- two build results

## File Structure
```
server.js
public/index.html
public/styles.css
public/app.js
.env.example
README.md
devpost/scope.md, prd.md, spec.md
```

## External Services and Dependencies
The Gemini API through Google AI Studio. You need a free key. There are no npm packages.

## Important Failure Modes
- **Gemini returns invalid JSON:** the server falls back to the rule-based coach.
- **A build fails or times out:** that side shows an error and the other side still renders.
- **Generated code tries the network or the parent page:** blocked by the sandbox and the instructions.
- **Key leak:** the key stays server-side only, and `.env` is git-ignored.

## What Was Simplified and Why
- No accounts, rate limits or safety model. It runs locally for the demo, with no time left before the deadline.
- No database, because nothing needs saving.

## Decisions and Open Issues
- The page assembles the prompt so the AI can't rewrite it. This enforces the kernel in code.
- Offline mode exists so the app can be tried and tested without a key.

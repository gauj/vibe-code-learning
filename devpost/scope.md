---
doc: scope
status: draft
---

# Prompt Power-Up (working name)

A coach that teaches teens to write better AI prompts by **asking them questions** instead of rewriting their prompt, then builds the lazy and powered-up versions side by side.

## The Unique Kernel
**Flipped interaction for kids.** The coach never rewrites the prompt. It scores the teen's prompt on five parts (Role, Context, Task, Rules, Check) and asks short questions about the missing ones. The powered-up prompt is assembled **only from the teen's own words**. Building both prompts with identical instructions makes the difference impossible to miss.

## Who It's For
A teen (13+) in a Vibe live class who **keeps practising alone in the app between classes**, with no teacher beside them. Today they type lazy prompts ("make a quiz app") into Gemini, get a bland app back, and never learn why.

## The Core Loop
1. Type a lazy idea.
2. Answer 3–5 quick questions about the missing parts.
3. Watch the scorecard fill up.
4. See both apps built side by side.
5. Copy the powered-up prompt into Gemini (AI Studio) to keep building.

They come back with each new app idea.

## Inspiration & Identity
- The Prompt Lab "Power-Up" ladder on https://vibe.uploudly.com/lab: a fixed space quiz that levels up from 0 to 5.
- Playful, teen-friendly and bold: emoji labels, "Power up! ⚡", a progress meter.

## Why This Matters to the Learner
Vibe exists to teach teens to guide AI, not copy answers. The current coach rewrites prompts for students, so they can copy without learning. This version makes the student do the thinking.

## What "Working" Looks Like
A teen types "make a quiz app". The coach asks a few questions with example answers that fit that idea. As they answer, the scorecard goes from mostly empty to full. They press **Power up ⚡** and two apps appear side by side: a plain grey box and a styled, working app. **The "oh, that's cool" beat** is the moment the two previews appear next to each other.

## The POC Boundary
- **In:** one page with prompt input → scoring and questions → live scorecard → assembled prompt → two side-by-side sandboxed builds → a copy button.
- **Also in:** the Gemini API, called from a tiny local server so the key stays secret, and an offline demo mode when there's no key.

## Later
- The class dashboard: journey progress, profile, streaks, quests, class leaderboard and class wins.
- Teacher review and approval.
- Publishing to `yourname.vibe.uploudly.com` with a shareable public URL.
- Sign-in, daily run limits and a server-side safety model.

## Explicitly Cut
- **Accounts and the dashboard:** they don't prove the kernel, and there's no time before the deadline.
- **Teacher review and publishing:** those belong to the full Vibe product, not this experiment.
- **Reusing Vibe-v1 code:** not allowed by the hackathon rules, which accept old ideas but not old code.

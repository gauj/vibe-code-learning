# Prompt.Up.Loudly

Live: https://prompt.uploudly.com

A prompt coach for teens learning to build apps with AI. Type a lazy idea like "make a quiz app". The coach **doesn't rewrite it**. It scores your prompt on 5 parts (Role, Context, Task, Rules, Check) and asks you short questions about the missing ones. Your answers become the powered-up prompt. Then both prompts are built by the same AI builder and shown side by side, so you can see what a better prompt does.

Built for Devpost's **Build With AI: Basics** hackathon with the Devpost Learn Skill Pack. The planning docs are in [`devpost/`](devpost/): [scope](devpost/scope.md), [PRD](devpost/prd.md) and [spec](devpost/spec.md).

## School edition (branch `school-edition`)

Four ways to practise prompting, built for students aged 13+ in the US and India:
- **⚡ Power-Up**
- **🗺️ Quests** (5 levels plus a boss)
- **🔍 Spot the gap**
- **🏅 My progress** (saved on the device only)

There are no accounts and no personal data, and a guard blocks personal details before anything reaches the AI. See [docs/school-edition.md](docs/school-edition.md) and the in-app [privacy page](public/privacy.html).

## Run it

You need Node.js 20 or later. There are no npm packages to install.

```bash
cp .env.example .env      # then paste your Gemini API key into .env
node server.js
```

Open http://localhost:3000.

**No key?** It still runs in **offline demo mode**, with rule-based questions and two sample apps, so you can try the whole flow.

## How it works

- `server.js` is a tiny Node server. It serves the page and calls the Gemini API, so the key never reaches the browser.
  - `POST /api/coach` scores the prompt and returns questions, sentence leads and example answers.
  - `POST /api/build` turns a prompt into one self-contained HTML app. It uses the same builder instructions for both prompts.
- `public/app.js` **assembles the powered-up prompt itself**, from the original prompt plus each lead joined to the student's answer. That way the AI can't slip in its own wording.
- Generated apps run in `<iframe sandbox="allow-scripts">`, so they get no access to the page, no forms and no pop-ups.

## Not in this proof of concept

Accounts, daily limits, teacher review and publishing apps to a public URL.

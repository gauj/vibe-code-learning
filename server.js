// Prompt Power-Up: tiny server that serves the page and keeps the AI key off the client.
const http = require('http');
const fs = require('fs');
const path = require('path');

loadEnv(path.join(__dirname, '.env'));

const PORT = Number(process.env.PORT) || 3000;
// Provider: an OpenAI-compatible API (CheaperInference by default) if LLM_API_KEY is set, otherwise Gemini.
const LLM_BASE_URL = (process.env.LLM_BASE_URL || 'https://api.cheaperinference.com/v1').replace(/\/+$/, '');
const USE_OPENAI = Boolean(LLM_BASE_URL && process.env.LLM_API_KEY);
const API_KEY = USE_OPENAI ? process.env.LLM_API_KEY : process.env.GEMINI_API_KEY || '';
const MODEL = USE_OPENAI ? process.env.LLM_MODEL || '' : process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const DAILY_LIMIT = Number(process.env.DAILY_BUILDS) || 10; // power-ups per visitor per day (each = 2 builds)
const PUBLIC_DIR = path.join(__dirname, 'public');
const PARTS = ['role', 'context', 'task', 'rules', 'check'];

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

// ---------- Gemini ----------

async function gemini(prompt, { json = false } = {}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, ...(json ? { responseMimeType: 'application/json' } : {}) },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(90000),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
}

async function openaiCompatible(prompt, { json = false } = {}) {
  const res = await fetch(`${LLM_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    }),
    signal: AbortSignal.timeout(90000),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

const ask = USE_OPENAI ? openaiCompatible : gemini;

// Simple in-memory cap so a public key can't be run up by strangers.
const usage = new Map();
function allowRun(ip) {
  const day = new Date().toISOString().slice(0, 10);
  const key = `${day}|${ip}`;
  if (usage.size > 5000) usage.clear();
  const n = usage.get(key) || 0;
  if (n >= DAILY_LIMIT * 3) return false; // 1 coach call + 2 builds per power-up
  usage.set(key, n + 1);
  return true;
}

function clientIp(req) {
  return req.headers['cf-connecting-ip'] || String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;
}

const COACH_PROMPT = (idea) => `You are Vibo, a friendly prompt coach for teens (13+) learning to build apps with AI.
A student typed this app prompt: """${idea}"""

Score it on 5 parts, each 0 (missing), 1 (vague) or 2 (clear):
- role: who the AI should be
- context: the idea, who it's for, the vibe
- task: the one job the app does
- rules: look, limits, phone-friendly
- check: asks the AI to explain or to ask questions

For every part scoring 0 or 1, write ONE short question (max 12 words) that helps the student fill it in,
a sentence "lead" the student's answer will be appended to (e.g. "You are", "It's for", "The app should", "Make it", "After the code,"),
and 2-3 short example answers (max 8 words each) that fit THIS student's idea.
Never ask for personal details (names, school, location, contact info). Do NOT rewrite the prompt.
Also give "praise": one short encouraging sentence about something in their prompt.

Return JSON only:
{"praise": string, "parts": [{"key": "role"|"context"|"task"|"rules"|"check", "score": 0|1|2, "question": string, "lead": string, "examples": [string]}]}
Include all 5 parts in order; for parts scoring 2, question/lead may be empty strings and examples [].`;

const BUILD_PROMPT = (prompt) => `You are an app builder. Build exactly what the prompt below asks for, as ONE self-contained HTML file.
Builder rules (same for every prompt):
- Be LITERAL. Build only what the prompt actually says. Do not add features, content, styling, colours, themes or polish the prompt doesn't ask for. If the prompt is vague, make the simplest plain version (default browser styles, 1-2 items).
- Inline all CSS and JavaScript. No external files, fonts, images, CDNs or network requests.
- No forms that collect personal data. No alert() popups.
- Keep it under 250 lines.
- Respond with the HTML file first, then a line containing only "---EXPLAIN---", then: if the prompt asks you to explain something, 1-2 short sentences answering it; if it does NOT ask for an explanation, write exactly "No explanation requested." and nothing else.

Prompt:
"""${prompt}"""`;

function cleanCoach(raw) {
  const data = typeof raw === 'string' ? JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)) : raw;
  const byKey = Object.fromEntries((data.parts || []).map((p) => [p.key, p]));
  return {
    praise: String(data.praise || '').slice(0, 200),
    parts: PARTS.map((key) => {
      const p = byKey[key] || {};
      const score = [0, 1, 2].includes(p.score) ? p.score : 0;
      return {
        key,
        score,
        question: String(p.question || '').slice(0, 120),
        lead: String(p.lead || '').slice(0, 60),
        examples: (Array.isArray(p.examples) ? p.examples : []).slice(0, 3).map((e) => String(e).slice(0, 80)),
      };
    }),
  };
}

function splitBuild(text) {
  const [htmlPart, explainPart = ''] = text.split(/^\s*---EXPLAIN---\s*$/m);
  const html = htmlPart.replace(/^\s*```(?:html)?\s*/i, '').replace(/```\s*$/, '').trim();
  if (!/<(html|body|div|script|style)/i.test(html)) throw new Error('No HTML in build output');
  return { html, explain: explainPart.trim().slice(0, 300) };
}

// ---------- Offline demo mode (no API key) ----------

function offlineCoach(idea) {
  const t = idea.toLowerCase();
  const has = {
    role: /\byou are\b|act as|pretend/.test(t),
    context: /\bfor (my|kids|teens|friends|class)|age \d|vibe|theme/.test(t),
    task: /\d+[- ]question|score|button|level|timer|track/.test(t),
    rules: /colou?r|phone|mobile|dark|big|style|font/.test(t),
    check: /explain|ask me|questions? first/.test(t),
  };
  const q = {
    role: ['Who should the AI pretend to be?', 'You are', ['a game designer for teens', 'a fun quiz-show host']],
    context: ['Who is it for, and what vibe?', "It's for", ['my classmates, age 14, space vibe', 'my little cousin, bright and silly']],
    task: ['What exactly should the app do?', 'The app should', ['ask 5 questions, keep score, show results', 'give instant feedback and a play-again button']],
    rules: ['How should it look and feel?', 'Make it', ['dark navy with purple glow, big buttons', 'phone-friendly with one HTML file']],
    check: ['What should the AI explain after building?', 'After the code,', ['explain how the score is counted', 'ask me what to improve next']],
  };
  return {
    praise: 'Nice start: you know what kind of app you want!',
    parts: PARTS.map((key) => (has[key]
      ? { key, score: 2, question: '', lead: '', examples: [] }
      : { key, score: /\w{3,}/.test(t) && key === 'task' ? 1 : 0, question: q[key][0], lead: q[key][1], examples: q[key][2] })),
  };
}

function offlineBuild(prompt) {
  const powered = prompt.length > 80;
  if (!powered) {
    return {
      html: '<html><body style="font-family:serif"><h1>Quiz App</h1><p>What is 2 + 2?</p><input><button>Submit</button></body></html>',
      explain: 'No explanation requested.',
    };
  }
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
body{margin:0;font-family:system-ui;background:radial-gradient(circle at 30% 20%,#2a1f6b,#0b0c2a);color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center}
.c{width:min(92%,380px);text-align:center}h2{font-size:1.4rem}.s{color:#a3e635;font-weight:700}
button{display:block;width:100%;margin:10px 0;padding:14px;border:0;border-radius:14px;background:#2b2e6e;color:#fff;font-size:1rem;cursor:pointer}
button.ok{background:#16a34a}button.no{background:#dc2626}</style></head><body><div class="c">
<p class="s">🚀 Score: <span id="sc">0</span>/5</p><h2 id="q"></h2><div id="a"></div></div><script>
const Q=[["Which planet is the Red Planet?",["Venus","Mars","Jupiter"],1],["What is the closest star to Earth?",["The Sun","Sirius","Polaris"],0],["How many planets are in our solar system?",["7","8","9"],1],["Which planet has the biggest rings?",["Saturn","Mars","Earth"],0],["What do we call a moon's path?",["Orbit","Comet","Galaxy"],0]];
let i=0,s=0;function show(){if(i>=Q.length){document.getElementById('q').textContent='🎉 You got '+s+'/5!';document.getElementById('a').innerHTML='<button onclick="i=0;s=0;sc.textContent=0;show()">Play again</button>';return}
const[t,o,c]=Q[i];document.getElementById('q').textContent=t;const a=document.getElementById('a');a.innerHTML='';o.forEach((x,j)=>{const b=document.createElement('button');b.textContent=x;b.onclick=()=>{b.className=j===c?'ok':'no';if(j===c)s++;sc.textContent=s;setTimeout(()=>{i++;show()},600)};a.appendChild(b)})}show();
</script></body></html>`;
  return { html, explain: 'Offline sample: you get a point for each right answer, out of 5.' };
}

// ---------- HTTP ----------

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > 20000) { reject(new Error('Too large')); req.destroy(); }
      else chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}')); } catch (e) { reject(e); }
    });
  });
}

function send(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

async function handleApi(req, res, route) {
  let body;
  try { body = await readJson(req); } catch { return send(res, 400, { error: 'Bad request' }); }
  const offline = !API_KEY;

  if (route === '/api/coach') {
    const idea = String(body.prompt || '').trim().slice(0, 300);
    if (!idea) return send(res, 400, { error: 'Type an idea first.' });
    if (offline) return send(res, 200, { offline, ...offlineCoach(idea) });
    if (!allowRun(clientIp(req))) return send(res, 429, { error: "You've hit today's power-up limit. Come back tomorrow!" });
    try {
      return send(res, 200, { offline, ...cleanCoach(await ask(COACH_PROMPT(idea), { json: true })) });
    } catch (e) {
      console.error('coach:', e.message);
      return send(res, 200, { offline, fallback: true, ...offlineCoach(idea) });
    }
  }

  if (route === '/api/build') {
    const prompt = String(body.prompt || '').trim().slice(0, 2000);
    if (!prompt) return send(res, 400, { error: 'Empty prompt.' });
    if (offline) {
      await new Promise((r) => setTimeout(r, 1200));
      return send(res, 200, { offline, ...offlineBuild(prompt) });
    }
    if (!allowRun(clientIp(req))) return send(res, 429, { error: "Today's build limit is reached. Come back tomorrow!" });
    try {
      return send(res, 200, { offline, ...splitBuild(await ask(BUILD_PROMPT(prompt))) });
    } catch (e) {
      console.error('build:', e.message);
      return send(res, 502, { error: "This one didn't build. Try again." });
    }
  }

  return send(res, 404, { error: 'Not found' });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'POST' && url.pathname.startsWith('/api/')) return handleApi(req, res, url.pathname);
  if (req.method === 'GET' && url.pathname === '/api/status') return send(res, 200, { offline: !API_KEY, model: MODEL });

  const file = path.normalize(path.join(PUBLIC_DIR, url.pathname === '/' ? 'index.html' : url.pathname));
  if (!file.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Prompt Power-Up running at http://localhost:${PORT} (${API_KEY ? `${USE_OPENAI ? LLM_BASE_URL : 'Gemini'} ${MODEL}` : 'offline demo mode'})`);
});

// Prompt Power-Up: the page builds the final prompt itself, so the AI can never rewrite it.
// `why` is the one-line lesson a teen sees while answering, so no teacher is needed.
const PART_INFO = {
  role: { label: 'Role', emoji: '🎭', why: 'Giving the AI a job makes it think like an expert.' },
  context: { label: 'Context', emoji: '📦', why: 'Saying who it\'s for and the vibe stops the AI guessing.' },
  task: { label: 'Task', emoji: '🎯', why: 'One clear job = an app that actually works.' },
  rules: { label: 'Rules', emoji: '📏', why: 'Rules on look and limits turn a grey box into your style.' },
  check: { label: 'Check', emoji: '💬', why: 'Asking the AI to explain helps you understand your own code.' },
};
const STARTERS = ['make a quiz app', 'make a game', 'make a pet tracker', 'make a study timer'];
const $ = (id) => document.getElementById(id);

let state = { idea: '', parts: [], answers: {} };

fetch('/api/status').then((r) => r.json()).then((s) => { $('mode').hidden = !s.offline; }).catch(() => {});

$('idea').addEventListener('input', () => { $('checkBtn').disabled = !$('idea').value.trim(); });
$('idea').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !$('checkBtn').disabled) $('checkBtn').click(); });
$('checkBtn').addEventListener('click', checkPrompt);
$('powerBtn').addEventListener('click', buildBoth);
$('copyBtn').addEventListener('click', copyPrompt);
$('againBtn').addEventListener('click', reset);

for (const s of STARTERS) {
  const chip = document.createElement('button');
  chip.className = 'chip';
  chip.type = 'button';
  chip.textContent = s;
  chip.addEventListener('click', () => { $('idea').value = s; $('checkBtn').disabled = false; $('idea').focus(); });
  $('starters').appendChild(chip);
}

async function post(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

function showError(msg) { $('error').textContent = msg; $('error').hidden = !msg; }

async function checkPrompt() {
  showError('');
  state = { idea: $('idea').value.trim(), parts: [], answers: {} };
  const btn = $('checkBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="dots">Vibo is thinking</span>';
  try {
    const data = await post('/api/coach', { prompt: state.idea });
    state.parts = data.parts;
    $('praise').textContent = `${data.praise || 'Nice start!'} Answer my questions and watch your prompt power up. 👇`;
    renderQuestions();
    $('step2').hidden = false;
    $('step3').hidden = true;
    $('step1').classList.add('done');
    $('step2').scrollIntoView({ behavior: 'smooth', block: 'start' });
    const first = document.querySelector('#questions input');
    if (first) first.focus({ preventScroll: true });
  } catch (e) {
    showError(`Vibo couldn't check that one. ${e.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Check my prompt 🔍';
  }
}

function renderQuestions() {
  const box = $('questions');
  box.innerHTML = '';
  const todo = state.parts.filter((p) => p.score < 2 && p.question);
  if (!todo.length) {
    box.innerHTML = '<div class="q"><p>🏆 Legendary! Your prompt already has all 5 parts. Power it up!</p></div>';
  }
  for (const p of todo) {
    const info = PART_INFO[p.key];
    const div = document.createElement('div');
    div.className = `q ${p.key}`;
    div.innerHTML = `
      <div class="q-head">${info.emoji} ${info.label} · ${p.score === 0 ? 'missing' : 'vague'}</div>
      <p></p>
      <div class="lead-row"><span class="lead"></span><input maxlength="120" placeholder="your answer…"></div>
      <div class="chips"></div>
      <p class="why"></p>`;
    div.querySelector('p').textContent = p.question;
    div.querySelector('.why').textContent = `💡 Why? ${info.why}`;
    div.querySelector('.lead').textContent = p.lead;
    const input = div.querySelector('input');
    input.addEventListener('input', () => { state.answers[p.key] = input.value; update(); });
    for (const ex of p.examples) {
      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.type = 'button';
      chip.textContent = ex;
      chip.addEventListener('click', () => { input.value = ex; state.answers[p.key] = ex; update(); });
      div.querySelector('.chips').appendChild(chip);
    }
    box.appendChild(div);
  }
  update();
}

// Score a part as clear once the student has answered it.
function liveScore(p) {
  return (state.answers[p.key] || '').trim().length >= 3 ? 2 : p.score;
}

// Each block is tagged with the part it fills, so the page can colour-code the prompt.
function promptBlocks() {
  const sentence = (t) => {
    t = t.trim();
    if (!/[.!?]$/.test(t)) t += '.';
    return t.charAt(0).toUpperCase() + t.slice(1);
  };
  const blocks = [{ part: 'idea', text: sentence(state.idea) }];
  for (const p of state.parts) {
    const a = (state.answers[p.key] || '').trim();
    if (!a || p.score === 2) continue;
    blocks.push({ part: p.key, text: sentence(`${p.lead} ${a}`) });
  }
  return blocks;
}

function assemble() {
  return promptBlocks().map((b) => b.text).join('\n');
}

function update() {
  const scores = state.parts.map(liveScore);
  const total = scores.reduce((a, b) => a + b, 0);
  const pct = Math.round((total / 10) * 100);
  $('meterFill').style.width = `${pct}%`;
  $('meterLabel').textContent = `${total}/10 · ${total >= 9 ? 'Legendary 🏆' : total >= 6 ? 'Strong 💪' : total >= 3 ? 'Getting there' : 'Weak 😴'}`;
  $('parts').innerHTML = '';
  state.parts.forEach((p, i) => {
    const info = PART_INFO[p.key];
    const li = document.createElement('li');
    li.className = `${p.key}${scores[i] === 2 ? ' on' : ''}`;
    li.innerHTML = `<span>${scores[i] === 2 ? '✅' : scores[i] === 1 ? '🟡' : '⬜'} ${info.emoji} ${info.label}</span><span class="s">${scores[i]}/2</span>`;
    $('parts').appendChild(li);
  });
  const box = $('assembled');
  box.innerHTML = '';
  for (const b of promptBlocks()) {
    const row = document.createElement('div');
    row.className = `part ${b.part}`;
    const label = document.createElement('span');
    label.className = 'pl';
    label.textContent = b.part === 'idea' ? '💡 Your idea' : `${PART_INFO[b.part].emoji} ${PART_INFO[b.part].label}`;
    const text = document.createElement('span');
    text.className = 'pt';
    text.textContent = b.text;
    row.append(label, text);
    box.appendChild(row);
  }
}

function frameStatus(el, html, isErr) {
  el.innerHTML = `<div class="status${isErr ? ' err' : ''}">${html}</div>`;
}

// Runs first inside every preview: sandboxed frames can't use real storage (it throws and
// crashes the app), so give them an in-memory stand-in, and show crashes instead of a blank box.
const PREVIEW_SHIM = `<script>
(function () {
  function mem() { var d = {}; return { getItem: function (k) { return k in d ? d[k] : null; }, setItem: function (k, v) { d[k] = String(v); },
    removeItem: function (k) { delete d[k]; }, clear: function () { d = {}; }, key: function (i) { return Object.keys(d)[i] || null; }, get length() { return Object.keys(d).length; } }; }
  ['localStorage', 'sessionStorage'].forEach(function (n) {
    try { window[n].length; } catch (e) { try { Object.defineProperty(window, n, { value: mem(), configurable: true }); } catch (e2) {} }
  });
  window.alert = function (m) { console.log(m); };
  window.addEventListener('error', function (e) {
    if (document.getElementById('__err')) return;
    var b = document.createElement('div'); b.id = '__err';
    b.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;padding:10px;border-radius:10px;background:#fee2e2;color:#991b1b;font:14px system-ui;z-index:99999';
    b.textContent = '🐛 This app has a bug: ' + e.message + '. Try Power up again!';
    (document.body || document.documentElement).appendChild(b);
  });
})();
<\/script>`;

function showApp(el, html) {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('sandbox', 'allow-scripts'); // no same-origin, no forms, no popups
  iframe.setAttribute('referrerpolicy', 'no-referrer');
  iframe.srcdoc = PREVIEW_SHIM + html;
  el.innerHTML = '';
  el.appendChild(iframe);
}

async function buildOne(prompt, frameEl, explainEl, metaEl, isPowered) {
  frameStatus(frameEl, '<div>🔨 Building… usually 10–30 s<div class="shimmer"></div></div>');
  explainEl.textContent = '';
  explainEl.hidden = true;
  metaEl.textContent = '';
  try {
    const data = await post('/api/build', { prompt });
    showApp(frameEl, data.html);
    const lines = data.html.split('\n').length;
    metaEl.textContent = `${lines} line${lines === 1 ? '' : 's'} of code`;
    const explain = data.explain && !/^no explanation/i.test(data.explain) ? data.explain : '';
    if (explain) {
      explainEl.innerHTML = '<span class="eyebrow"></span><br>';
      explainEl.querySelector('.eyebrow').textContent = isPowered ? 'Your Check part worked: the AI explains' : 'The AI explains';
      explainEl.append(explain);
      explainEl.hidden = false;
    }
    return true;
  } catch (e) {
    frameStatus(frameEl, `😕 ${e.message}`, true);
    return false;
  }
}

async function buildBoth() {
  showError('');
  const btn = $('powerBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="dots">Building both apps</span>';
  $('step3').hidden = false;
  $('step3').scrollIntoView({ behavior: 'smooth', block: 'start' });
  const results = await Promise.all([
    buildOne(state.idea, $('frameLazy'), $('explainLazy'), $('metaLazy'), false),
    buildOne(assemble(), $('framePower'), $('explainPower'), $('metaPower'), true),
  ]);
  if (!results.some(Boolean)) showError('Both builds failed. Check your connection and try again.');
  else renderLearned();
  btn.disabled = false;
  btn.textContent = 'Power up again ⚡';
}

async function copyPrompt() {
  try {
    await navigator.clipboard.writeText(assemble());
    $('copyBtn').textContent = '✅ Copied! Paste it in Gemini';
  } catch {
    $('copyBtn').textContent = 'Select the prompt above and copy it';
  }
  setTimeout(() => { $('copyBtn').textContent = '📋 Copy my prompt'; }, 2500);
}

// Self-guided wrap-up: which parts the teen added, and one challenge to try next.
function renderLearned() {
  const added = state.parts.filter((p) => p.score < 2 && (state.answers[p.key] || '').trim());
  const missing = state.parts.filter((p) => liveScore(p) < 2);
  const list = $('learnedList');
  list.innerHTML = '';
  for (const p of added) {
    const li = document.createElement('li');
    li.className = p.key;
    li.innerHTML = '<b></b> ';
    li.querySelector('b').textContent = `${PART_INFO[p.key].emoji} You added ${PART_INFO[p.key].label}.`;
    li.append(PART_INFO[p.key].why);
    list.appendChild(li);
  }
  if (!added.length) list.innerHTML = '<li>Your prompt already had all 5 parts. Legend! 🏆</li>';
  $('challenge').textContent = missing.length
    ? `🎯 Next challenge: add a ${PART_INFO[missing[0].key].label} part and power up again.`
    : '🎯 Next challenge: change one Rule (a new colour or vibe) and see how the app changes.';
  $('learned').hidden = false;
}

function reset() {
  $('learned').hidden = true;
  state = { idea: '', parts: [], answers: {} };
  $('idea').value = '';
  $('checkBtn').disabled = true;
  $('step2').hidden = true;
  $('step3').hidden = true;
  $('step1').classList.remove('done');
  showError('');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  $('idea').focus();
}

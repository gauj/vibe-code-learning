// Quests, Spot the gap and My progress. Everything here runs in the browser: no AI calls,
// nothing sent to the server. Progress is badges and counts only, never prompt text.

// ---------- Progress (device-only) ----------
const Progress = (() => {
  const KEY = 'pul.progress.v1';
  const blank = () => ({ quests: {}, spot: { right: 0, tries: 0 }, powerups: 0 });
  let data = blank();
  try { data = { ...blank(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { /* private mode: keep in memory */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* ignore */ } render(); };
  return {
    get: () => data,
    questDone: (n) => { data.quests[n] = true; save(); },
    spotTry: (right) => { data.spot.tries++; if (right) data.spot.right++; save(); },
    bump: () => { data.powerups++; save(); },
    clear: () => { data = blank(); try { localStorage.removeItem(KEY); } catch { /* ignore */ } render(); },
  };
})();
window.Progress = Progress;

const BADGES = [
  { id: 'q1', emoji: '🎭', name: 'Role Rookie', how: 'Finish Quest 1', has: (d) => d.quests[1] },
  { id: 'q2', emoji: '📦', name: 'Context Captain', how: 'Finish Quest 2', has: (d) => d.quests[2] },
  { id: 'q3', emoji: '🎯', name: 'Task Master', how: 'Finish Quest 3', has: (d) => d.quests[3] },
  { id: 'q4', emoji: '📏', name: 'Rule Maker', how: 'Finish Quest 4', has: (d) => d.quests[4] },
  { id: 'q5', emoji: '💬', name: 'Check Champ', how: 'Finish Quest 5', has: (d) => d.quests[5] },
  { id: 'q6', emoji: '👑', name: 'Prompt Boss', how: 'Beat the Boss quest', has: (d) => d.quests[6] },
  { id: 'spot', emoji: '🔍', name: 'Gap Spotter', how: 'Spot 5 prompts perfectly', has: (d) => d.spot.right >= 5 },
  { id: 'pu1', emoji: '⚡', name: 'First Power-Up', how: 'Power up a prompt', has: (d) => d.powerups >= 1 },
  { id: 'pu5', emoji: '🚀', name: 'Power Player', how: 'Power up 5 prompts', has: (d) => d.powerups >= 5 },
];

// ---------- Part detection, used to check quest prompts locally ----------
const DETECT = {
  role: /\b(you are|you're|act as|pretend (to be|you are)|imagine you are|be an? \w+|as an? (\w+ )?(expert|teacher|tutor|coach|designer|developer|host|guide|writer))\b/i,
  context: /\b(for (my |a |an |the |new |young )?(\w+ )?(class|classmates|students|kids|teens|friends|family|beginners|people|players|users|readers|sister|brother|cousin|team|club)|aged? \d+|\d+[- ]year[- ]olds?|grade \d+|vibe|theme|mood|so that|because|who (want|love|like|are))\b/i,
  task: /\b(should|must|will|needs? to|lets? (me|users|players|you)|shows?|keeps? (score|track)|tracks?|counts?|adds?|lists?|timer|score|questions?|levels?|saves?|sorts?|picks?|random|results?|tap|click|choose|flip|beep)\b/gi,
  rules: /\b(colou?rs?|dark|light|bright|calm|navy|blue|green|purple|pink|red|yellow|font|big|large|small|mobile|phone|one (html )?file|single file|no (images|sound|ads|login)|only|under \d+|max(imum)? \d+|simple|minimal|layout|emoji|style|rounded)\b/i,
  check: /\b(explain|ask me|ask (any |\d+ )?questions|questions? (first|before)|tell me (how|why|what)|walk me through|step by step|comments?|list (any )?(assumptions|bugs))\b/i,
};

function detect(text) {
  const t = String(text || '');
  const taskHits = (t.match(DETECT.task) || []).length;
  return {
    role: DETECT.role.test(t),
    context: DETECT.context.test(t),
    task: taskHits >= 2 || (taskHits >= 1 && /\d/.test(t)),
    rules: DETECT.rules.test(t),
    check: DETECT.check.test(t),
  };
}

const PARTS_ORDER = ['role', 'context', 'task', 'rules', 'check'];
const LABEL = { role: '🎭 Role', context: '📦 Context', task: '🎯 Task', rules: '📏 Rules', check: '💬 Check' };

// ---------- Quests ----------
const QUESTS = [
  { title: 'Give the AI a job', need: ['role'], start: 'Make a flashcard app to study science.',
    mission: 'This prompt has no Role. Add a sentence telling the AI <b>who it is</b>, so it thinks like an expert.',
    hint: 'Start with "You are…". For example: "You are a friendly science teacher."' },
  { title: 'Who is it for?', need: ['role', 'context'], start: 'You are a game designer. Make a maths game.',
    mission: 'Add <b>Context</b>: who the app is for and the vibe you want. The AI stops guessing.',
    hint: 'Try "…for my classmates, age 13, with a space vibe."' },
  { title: 'One clear job', need: ['role', 'context', 'task'], start: 'You are a fitness coach. Make an app for teens who are new to exercise.',
    mission: 'Add a clear <b>Task</b>: exactly what the app does. Use a number if you can.',
    hint: 'Try "It should show 5 exercises and count down 30 seconds for each."' },
  { title: 'Set the rules', need: ['role', 'context', 'task', 'rules'], start: 'You are a coding tutor. Make a to-do list for students who forget homework. It should let me add and tick off tasks.',
    mission: 'Add <b>Rules</b>: how it should look and any limits. This turns a grey box into your style.',
    hint: 'Try "Use a calm blue theme, big buttons, and keep it in one HTML file."' },
  { title: 'Check the work', need: ['role', 'context', 'task', 'rules', 'check'], start: 'You are a music teacher. Make a rhythm game for beginners where you tap along and get a score out of 10. Bright colours, works on a phone.',
    mission: 'Add a <b>Check</b>: ask the AI to explain its work or ask you questions first. That is how you learn from AI.',
    hint: 'Try "After the code, explain how the score is counted."' },
  { title: 'Boss level: all five', need: ['role', 'context', 'task', 'rules', 'check'], start: 'make a story app',
    mission: 'The boss! Turn this lazy prompt into a full prompt with <b>all five parts</b>: Role, Context, Task, Rules and Check.',
    hint: 'Go part by part: You are… · It\'s for… · It should… · Make it… · After the code, explain…' },
];

let questIdx = 0;
const qEl = (id) => document.getElementById(id);

function renderQuestMap() {
  const d = Progress.get();
  const map = qEl('questMap');
  map.innerHTML = '';
  QUESTS.forEach((q, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.className = `quest-dot${d.quests[i + 1] ? ' done' : ''}${i === questIdx ? ' current' : ''}`;
    b.textContent = d.quests[i + 1] ? '✅' : String(i + 1);
    b.setAttribute('aria-label', `Level ${i + 1}: ${q.title}${d.quests[i + 1] ? ' (done)' : ''}`);
    b.addEventListener('click', () => openQuest(i));
    li.appendChild(b);
    map.appendChild(li);
  });
}

function openQuest(i) {
  questIdx = i;
  const q = QUESTS[i];
  qEl('questLevel').textContent = `Level ${i + 1} of ${QUESTS.length}`;
  qEl('questTitle').textContent = q.title;
  qEl('questMission').innerHTML = q.mission; // static text from QUESTS above
  qEl('questInput').value = q.start;
  qEl('questResult').innerHTML = '';
  qEl('questNext').hidden = true;
  qEl('questGuard').hidden = true;
  renderQuestMap();
}

function checkQuest() {
  const text = qEl('questInput').value;
  const g = Guard.check(text);
  qEl('questGuard').hidden = g.ok;
  if (!g.ok) { qEl('questGuard').textContent = g.message; return; }
  const q = QUESTS[questIdx];
  const found = detect(text);
  const missing = q.need.filter((k) => !found[k]);
  const box = qEl('questResult');
  box.innerHTML = '';
  const list = document.createElement('ul');
  list.className = 'part-checks';
  for (const k of q.need) {
    const li = document.createElement('li');
    li.className = k;
    li.textContent = `${found[k] ? '✅' : '⬜'} ${LABEL[k]}`;
    list.appendChild(li);
  }
  const msg = document.createElement('p');
  msg.className = missing.length ? 'try' : 'win';
  if (missing.length) {
    msg.textContent = `Almost! Vibo can't find ${missing.map((k) => LABEL[k]).join(', ')} yet. Tap 💡 Hint if you're stuck.`;
  } else {
    msg.textContent = questIdx === QUESTS.length - 1
      ? '👑 Boss beaten! You can write a full five-part prompt. Try it for real in ⚡ Power-Up.'
      : `🎉 Level complete! You earned ${BADGES[questIdx].emoji} ${BADGES[questIdx].name}.`;
    Progress.questDone(questIdx + 1);
    qEl('questNext').hidden = questIdx >= QUESTS.length - 1;
  }
  box.append(list, msg);
  renderQuestMap();
}

qEl('questCheck').addEventListener('click', checkQuest);
qEl('questHint').addEventListener('click', () => {
  const p = document.createElement('p');
  p.className = 'hint-box';
  p.textContent = `💡 ${QUESTS[questIdx].hint}`;
  qEl('questResult').replaceChildren(p);
});
qEl('questNext').addEventListener('click', () => openQuest(Math.min(questIdx + 1, QUESTS.length - 1)));

// ---------- Spot the gap ----------
const SPOTS = [
  { text: 'make a quiz app', missing: ['role', 'context', 'task', 'rules', 'check'],
    why: 'A classic lazy prompt. "Make a quiz app" is too vague to count as a clear task: how many questions? About what?' },
  { text: 'You are a game designer. Build a game.', missing: ['context', 'task', 'rules', 'check'],
    why: 'Great Role! But "build a game" leaves the AI guessing what game, for whom, and how it should look.' },
  { text: 'Make a timer that counts down 25 minutes and beeps at the end.', missing: ['role', 'context', 'rules', 'check'],
    why: 'The Task is clear (25 minutes, beep). Nothing says who it is for, how it looks, or asks the AI to explain.' },
  { text: 'You are a science teacher. Make a 5-question quiz about planets for my class of 13-year-olds.', missing: ['rules', 'check'],
    why: 'Role, Context and Task are all there. Add Rules (look, limits) and a Check to make it legendary.' },
  { text: 'Make a habit tracker for teens who want to drink more water, where I tap +1 for each glass. Use big buttons and a calm blue theme.', missing: ['role', 'check'],
    why: 'Strong Context, Task and Rules. It never gives the AI a Role or asks it to explain anything.' },
  { text: 'You are a coding tutor. Build a to-do list where I can add, tick and delete tasks. Keep it in one HTML file with dark mode. Explain how the delete button works.', missing: ['context'],
    why: 'Only Context is missing: who is it for, and what vibe? A to-do list for a busy student feels different from one for a 6-year-old.' },
  { text: 'For my book club friends who love mysteries, make something fun with a spooky vibe.', missing: ['role', 'task', 'rules', 'check'],
    why: 'Lovely Context, but "something fun" is not a task. What should it actually do?' },
  { text: 'You are a music teacher. Make a rhythm game for beginners where you tap along to a beat and get a score out of 10. Bright colours, works on a phone. Ask me 3 questions before you start.', missing: [],
    why: 'Trick question: nothing is missing! This prompt has all five parts.' },
  { text: 'Make an app. Use pink and purple, big text, no sound. After the code, explain how it works.', missing: ['role', 'context', 'task'],
    why: 'Rules and Check are there, but the AI has no idea what the app is, who it is for, or who to be.' },
  { text: 'You are a fitness coach. Make a 7-minute workout timer that shows each exercise name and counts down 30 seconds each, for teens who are new to exercise.', missing: ['rules', 'check'],
    why: 'Role, Task and Context are clear. Add Rules for the look and a Check so you understand the code.' },
];

let spotIdx = 0;
let spotPicked = new Set();

function renderSpot() {
  const s = SPOTS[spotIdx];
  qEl('spotCount').textContent = `Prompt ${spotIdx + 1} of ${SPOTS.length}`;
  qEl('spotPrompt').textContent = `"${s.text}"`;
  spotPicked = new Set();
  const box = qEl('spotParts');
  box.innerHTML = '';
  for (const k of PARTS_ORDER) {
    const b = document.createElement('button');
    b.className = `spot-chip ${k}`;
    b.textContent = LABEL[k];
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => {
      if (spotPicked.has(k)) spotPicked.delete(k); else spotPicked.add(k);
      b.setAttribute('aria-pressed', String(spotPicked.has(k)));
    });
    box.appendChild(b);
  }
  qEl('spotResult').innerHTML = '';
  qEl('spotCheck').hidden = false;
  qEl('spotNext').hidden = true;
}

function checkSpot() {
  const s = SPOTS[spotIdx];
  const want = new Set(s.missing);
  const right = PARTS_ORDER.every((k) => want.has(k) === spotPicked.has(k));
  Progress.spotTry(right);
  const list = document.createElement('ul');
  list.className = 'part-checks';
  for (const k of PARTS_ORDER) {
    const li = document.createElement('li');
    li.className = k;
    const ok = want.has(k) === spotPicked.has(k);
    li.textContent = `${ok ? '✅' : '❌'} ${LABEL[k]}: ${want.has(k) ? 'missing' : 'present'}`;
    list.appendChild(li);
  }
  const msg = document.createElement('p');
  msg.className = right ? 'win' : 'try';
  msg.textContent = `${right ? '🎉 Perfect spot!' : '🤔 Not quite.'} ${s.why}`;
  qEl('spotResult').replaceChildren(list, msg);
  qEl('spotParts').querySelectorAll('button').forEach((b) => { b.disabled = true; });
  qEl('spotCheck').hidden = true;
  qEl('spotNext').hidden = false;
}

qEl('spotCheck').addEventListener('click', checkSpot);
qEl('spotNext').addEventListener('click', () => { spotIdx = (spotIdx + 1) % SPOTS.length; renderSpot(); });

// ---------- My progress ----------
function render() {
  const d = Progress.get();
  const earned = BADGES.filter((b) => b.has(d));
  qEl('badgeStrip').textContent = earned.map((b) => b.emoji).join(' ');
  qEl('badgeStrip').title = earned.length ? earned.map((b) => b.name).join(', ') : '';
  const questsDone = Object.keys(d.quests).length;
  qEl('stats').innerHTML = '';
  for (const [n, label] of [[`${questsDone}/${QUESTS.length}`, 'Quests done'], [`${d.spot.right}/${d.spot.tries}`, 'Perfect spots'], [String(d.powerups), 'Power-ups']]) {
    const div = document.createElement('div');
    div.className = 'stat';
    div.innerHTML = '<b></b><span></span>';
    div.querySelector('b').textContent = n;
    div.querySelector('span').textContent = label;
    qEl('stats').appendChild(div);
  }
  const list = qEl('badgeList');
  list.innerHTML = '';
  for (const b of BADGES) {
    const li = document.createElement('li');
    li.className = b.has(d) ? 'earned' : 'locked';
    li.innerHTML = '<span class="be"></span><b></b><small></small>';
    li.querySelector('.be').textContent = b.has(d) ? b.emoji : '🔒';
    li.querySelector('b').textContent = b.name;
    li.querySelector('small').textContent = b.how;
    list.appendChild(li);
  }
}

qEl('clearProgress').addEventListener('click', () => {
  if (confirm('Clear all your badges and counts from this device?')) Progress.clear();
});

// ---------- Tabs (arrow keys move between tabs, as screen readers expect) ----------
const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(tab, focus) {
  for (const t of tabs) {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
  }
  if (focus) tab.focus();
  try { sessionStorage.setItem('pul.tab', tab.id); } catch { /* ignore */ }
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => selectTab(t));
  t.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      selectTab(tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length], true);
    }
  });
});

let startTab = tabs[0];
try { startTab = document.getElementById(sessionStorage.getItem('pul.tab')) || tabs[0]; } catch { /* ignore */ }
selectTab(startTab);
openQuest(Math.min(Object.keys(Progress.get().quests).length, QUESTS.length - 1));
renderSpot();
render();

// Student-safety guard, shared by the page (window.Guard) and the server (require).
// It runs BEFORE any text is sent to the AI: personal details are blocked, never sent.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Guard = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  // Each rule: what it catches, and the kid-friendly reason shown to the student.
  const PERSONAL = [
    { type: 'email', re: /[\w.+-]+@[\w-]+\.[\w.-]+/i, label: 'an email address' },
    { type: 'id', re: /\b\d{3}-\d{2}-\d{4}\b|\b\d{4}\s?\d{4}\s?\d{4}\b/, label: 'an ID number' },
    { type: 'phone', re: /(\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b|\b[6-9]\d{9}\b/, label: 'a phone number' },
    { type: 'link', re: /\bhttps?:\/\/\S+|\bwww\.\S+/i, label: 'a web link' },
    { type: 'handle', re: /(^|\s)@[a-z0-9_.]{3,}/i, label: 'a social media handle' },
    { type: 'address', re: /\b\d{1,5}\s+(\w+\s){0,3}(street|st|road|rd|avenue|ave|lane|ln|drive|dr|blvd|marg|nagar|colony|sector|apt|apartment|flat)\b/i, label: 'a home address' },
    { type: 'name', re: /\b(my name is|my name's|i am called|i'm called|call me)\s+[a-z]/i, label: 'your name' },
    { type: 'location', re: /\b(i live (in|at|on|near)|my address|my house is|my home is)\b/i, label: 'where you live' },
    { type: 'school', re: /\b(i go to|i study at|my school is|i attend)\b/i, label: 'your school' },
    { type: 'school', re: /\b[A-Z][a-z]+\s+((High|Middle|Public|International|Senior|Secondary|Elementary|Model)\s+)?(School|Vidyalaya|Academy)\b/, label: 'your school' },
    { type: 'birthday', re: /\b(born on|my birthday is|date of birth|dob)\b/i, label: 'your birthday' },
  ];

  // School-appropriate topics only. Self-harm gets a caring message instead of a scold.
  const CARE = /\b(kill myself|suicide|self[- ]harm|hurt myself|want to die)\b/i;
  const UNSAFE = /\b(porn|sex|nude|naked|gun|guns|rifle|bomb|explosive|weapon|drugs?|cocaine|weed|vape|alcohol|beer|gambl\w*|casino|bet(ting)?|hack (into|someone)|steal|murder|gore|racist|slur)\b/i;

  function check(text) {
    const t = String(text || '');
    if (CARE.test(t)) {
      return {
        ok: false,
        kind: 'care',
        message: "It sounds like something might be hard right now. Please talk to a trusted adult. In the US call or text 988; in India call Tele-MANAS on 14416. You matter. 💜",
      };
    }
    const found = PERSONAL.filter((r) => r.re.test(t));
    if (found.length) {
      const what = [...new Set(found.map((f) => f.label))].join(' and ');
      return {
        ok: false,
        kind: 'personal',
        types: found.map((f) => f.type),
        message: `🛡️ That looks like ${what}. Never share personal details with an AI. Take it out and try again!`,
      };
    }
    if (UNSAFE.test(t)) {
      return { ok: false, kind: 'unsafe', message: "🙅 Let's keep it school-friendly. Try an idea you'd happily show your class!" };
    }
    return { ok: true };
  }

  return { check };
});

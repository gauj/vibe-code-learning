// Fills in the live AI provider and contact so the privacy page always matches the server's settings.
fetch('/api/status').then((r) => r.json()).then((s) => {
  document.getElementById('provider').textContent = s.provider || 'not used right now (offline mode: no AI, nothing sent)';
  if (s.contact) {
    document.getElementById('contact').textContent = s.contact;
    document.getElementById('contactRow').hidden = false;
  }
}).catch(() => {});

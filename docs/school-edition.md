# School edition: design and compliance notes

**Single goal:** help students aged 13+ (US and India) learn to write better AI prompts, on their own, with no teacher required.

## What's new

| Mode | What the student does | AI? | Data sent |
|---|---|---|---|
| ⚡ Power-Up | Lazy idea → Vibo's questions → both apps side by side | Yes | Only the idea or prompt text, after the guard |
| 🗺️ Quests | 5 levels (Role, Context, Task, Rules, Check) plus a boss, checked locally | No | Nothing |
| 🔍 Spot the gap | Finds the missing parts in 10 sample prompts | No | Nothing |
| 🏅 My progress | Badges and counts, plus a "Clear my progress" button | No | Nothing (device-only `localStorage`) |

## Privacy by design

- **No personal data collected:** no accounts, forms, cookies, analytics, ads or third-party scripts.
- **Personal-info guard** (`public/guard.js`, shared by page and server). It blocks:
  - email addresses, phone numbers (US and India), Aadhaar or SSN-like ID numbers
  - links, social handles and street addresses
  - "my name is…", "I live in…", "I go to…" and school names
  - birthdays
  - unsafe topics
  - self-harm phrases, which get a caring message pointing to 988 (US) and Tele-MANAS 14416 (India) instead
- **The server re-checks every request** (`422`, no AI call), so bypassing the page doesn't help.
- **No student text in logs:** provider errors are logged as an HTTP status only.
- **Rate limiting** uses a salted, daily-rotating SHA-256 of the IP, kept in memory only. Raw IPs are never stored.
- **Security headers:** strict CSP (no third-party origins, `connect-src 'self'`, `form-action 'none'`, `frame-ancestors 'none'`), `Referrer-Policy: no-referrer`, `nosniff`, and a `Permissions-Policy` that turns off camera, microphone and location.
- **Generated apps** run in `sandbox="allow-scripts"` iframes. They inherit the CSP, so they can't make network calls.
- **Device storage** holds badges and counts only, never prompt text.

## Laws considered

- **US COPPA:** the audience is 13+, and no personal information is collected.
- **US FERPA:** no education records are created or stored.
- **India DPDP Act, 2023:** everyone under 18 counts as a child, and verifiable parental consent is required to process a child's personal data. Tracking, behavioural monitoring and targeted ads are prohibited. We process no personal data and do none of these.

This is a design summary, **not legal advice**. Get a lawyer to review it before schools adopt the app.

## Operator checklist before going live

1. **AI provider terms:** confirm the provider does **not store prompts or train on them**, and set `AI_PROVIDER_NAME` so the privacy page names it.
2. **`PRIVACY_CONTACT`:** set a contact email for parents and schools. It's shown on the privacy page.
3. **nginx access logs:** shorten retention, or turn off IP logging for this site.
4. **`.env` permissions:** `chmod 600`, owned by the app user.
5. **Gemini link:** Google's Gemini has its own age rules. Students should follow their school's AI-tool policy.

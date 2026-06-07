# Working on NightCanary

This file is for Claude (or any agentic assistant) resuming work on this project. Read it first; it'll save the user time.

## What this is

**NightCanary** — VibeHack London 2026 hackathon project. Track 1 Health Impact, Challenge 3 Prevention. A web app that helps a UK adult prepare for a GP appointment about possible sleep apnoea: voice-driven symptom intake → conversational follow-ups → overnight pulse-oximetry analysis → risk score → GP referral letter.

**Hackathon deadlines:**
- Build window: Sat 6 June 2026 10:30 → Sun 7 June 2026 12:00
- Devpost submission: 12:00 Sun
- Demo: 3 minutes, table-side, after submission

## Spec and plan

Read these first if you're new to the project:

- `../docs/superpowers/specs/2026-06-06-osa-early-detection-design.md` — design spec
- `../docs/superpowers/plans/2026-06-06-osa-early-detection-plan.md` — implementation plan (task-by-task)

Note these live in the parent directory `VibeHack Med/docs/`, NOT inside this project root.

## Current state (as of last commit)

✅ **Done and committed:**
- Phase 0: Next.js 16 + Tailwind v4 + minimal hand-rolled UI components (no shadcn — Tailwind v4 compat too fiddly for hackathon)
- Phase 1: Clinical scoring library with 14 passing tests (ODI, T90, SpO₂ stats, STOP-BANG, Epworth, combined risk)
- Phase 2: Claude + Whisper SDK wrappers; system prompts; in-memory session store
- Phase 3: All 7 API routes (`/api/transcribe`, `/api/chat`, `/api/oximetry`, `/api/score`, `/api/letter`, `/api/session-readings`, `/api/debug-session`)
- Phase 4: 4-step wizard UI with VoiceIntake, ChatFollowups, PulseOxStep, ResultsStep; landing page; USB serial test page

🚧 **In progress (Phase 5 — Ship):**
- Vercel deploy: NOT done. Repo is local only. Needs GitHub push + Vercel project setup.
- Demo script: NOT written. Spec has a draft in §10.
- Devpost submission copy: NOT done.
- Backup demo video: NOT recorded.
- Mobile responsive pass: minimal effort so far.
- Live pulse-ox USB integration: scaffolded (`lib/pulseox/serial.ts` + `/test-serial` page) but NOT plugged into the wizard. The teammate is working on the hardware.

⚠️ **Known issues / quirks:**
- Session store is in-memory on `globalThis`. Survives Turbopack hot reloads, but a full server restart wipes all sessions. On Vercel, only the warm function instance retains them — cold starts lose state.
- OpenAI key is a placeholder (`.env.local` still says `REPLACE_WITH_REAL_KEY` for OPENAI_API_KEY). Without it, the voice mic step fails — but the "type instead" disclosure in VoiceIntake.tsx works as a fallback.
- The Anthropic key in `.env.local` is real (user pasted in chat — should be rotated post-hackathon).
- Chat budget is capped at 9 user turns. Claude is also told via system prompt to bundle demographic questions (age/sex/neck/BMI) to fit within budget.

## How to resume

### Restart the dev server
```bash
cd osa-early-detection
npm run dev
```
Open <http://localhost:3000>.

### If you switched machines or env vars are missing
1. Copy `.env.example` to `.env.local`
2. Add real `ANTHROPIC_API_KEY` (Claude console)
3. Add real `OPENAI_API_KEY` (OpenAI platform)
4. `npm install` if `node_modules` is missing

### To verify everything still works
```bash
npm run test          # should be 14/14 passing
npm run build         # should be clean, 12 routes
```

### To smoke-test the full flow
1. Open `/assess`
2. Expand "No microphone? Type instead." and paste the Persona A symptom dump (see below)
3. Answer follow-ups (~6-9 turns; Claude should cover all STOP-BANG items)
4. Click "Sample: moderate OSA" on step 3
5. Wait for results — should show HIGH or MODERATE risk, an SpO₂ chart with dips, plain-English explanation, and a GP letter

### Test personas

**Persona A (HIGH risk, demo star):**
> I'm a 47 year old man and I've been exhausted for months. My wife says I snore really loudly. She's seen me stop breathing in the middle of the night. I get morning headaches and I'm a bit overweight. My GP put me on blood pressure tablets last year.

Answers: sleepiness questions → "often"; neck → "yes ~43cm"; BMI → "yes over 35"
→ Expected: STOP-BANG 7-8/8, Epworth 14-18/24, ODI ~22, risk = HIGH

**Persona B (LOW risk, negative control):**
> I'm 28, female, healthy. I sleep about 7 hours a night, sometimes a bit tired after lunch but not a problem. My partner has never complained about snoring. No high blood pressure. Healthy weight.

Answers: mostly "rarely" / "no"; neck ~32cm
→ Expected: STOP-BANG 0/8, Epworth low, ODI ~0, risk = LOW

### Debug a session
After a flow run, grab the `sessionId` from a network response (DevTools → Network → /api/chat → response body) and visit:
```
http://localhost:3000/api/debug-session?sessionId=<id>
```
Returns the full chat transcript, oximetry reading count, scored values, patient explanation, and letter.

## Architecture rules to preserve

These are deliberate. Don't let them drift.

1. **AI never diagnoses.** Risk scoring is deterministic TypeScript in `lib/clinical/*`. The LLM only:
   - Maps free-text → structured questionnaire answers (extraction)
   - Generates the GP letter (templated communication)
   - Generates the patient-facing explanation (plain-English translation)
2. **Clinical thresholds are cited.** ODI uses NICE NG202 bands; STOP-BANG and Epworth are public-domain validated instruments.
3. **The output is a *patient-prepared* letter, not a clinical assessment.** Letter prompt explicitly avoids diagnostic phrasing.
4. **Session is ephemeral.** No login, no persistence beyond memory. This is fine for a hackathon demo; flag it as future work for production.

## Common things the user will ask for

| Ask | Where to start |
|---|---|
| "Voice isn't working" | Check `OPENAI_API_KEY` in `.env.local`; check browser allows mic on localhost; the type-instead fallback always works |
| "Chat is looping / never ends" | Check `MAX_USER_TURNS` in `app/api/chat/route.ts` (currently 9); check the system prompt in `lib/llm/prompts.ts` |
| "Session not found" on results | Hot-reload wiped the in-memory map — should be fixed by `globalThis` stash in `lib/session.ts`. If still broken, restart dev server and re-run flow from `/assess` |
| "Score looks wrong" | Run `npm run test` to confirm clinical lib is OK. Then visit `/api/debug-session?sessionId=...` to see what Claude extracted |
| "Letter doesn't mention X" | The letter is generated from `session.chat` + `session.scored`. Check both in the debug endpoint to see what the LLM is seeing |
| "Deploy to Vercel" | `git push` → import on Vercel → add both env vars → redeploy |
| "Plug in the live pulse-ox" | See `lib/pulseox/serial.ts` and `/test-serial` page. Wire its readings into PulseOxStep via `/api/oximetry` with `{ sessionId, oximetry: { startedAt, endedAt, readings } }` |
| "Mock GP dashboard" | Not built — would be `app/gp-view/[id]/page.tsx`, reads `/api/debug-session`, renders the letter as if a clinician was viewing it |

## What NOT to do (lessons already learned)

- **Don't add shadcn/ui.** Tailwind v4 compat is a time sink. The hand-rolled `components/ui/*` works fine.
- **Don't fine-tune anything.** Claude already knows clinical content. RAG over NICE guidelines is overkill for the demo.
- **Don't rely on Claude emitting `<DONE>`.** It's unreliable. The server-side `MAX_USER_TURNS` cap is the source of truth for ending the chat.
- **Don't try to demo hardware that isn't working.** The seeded CSVs (`public/samples/*.csv`) are first-class demo inputs, not a fallback. The pulse-ox is a stretch wow factor.
- **Don't restructure the AI/deterministic split.** The whole "Appropriate and Safe Use of AI (20%)" judging case rests on it.

## Tech stack reminder

- Next.js 16.2 (Turbopack) + React 19.2 + TypeScript
- Tailwind v4 (no shadcn)
- Anthropic SDK (Claude Sonnet 4.6) + OpenAI SDK (Whisper)
- Recharts for the overnight chart
- Vitest for clinical lib tests
- Vercel target

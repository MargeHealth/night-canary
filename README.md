# NightCanary

> Catch sleep apnoea before it catches you.

**VibeHack London 2026 — Track 1 Health Impact — Challenge 3 Prevention and Early Intervention.**

A self-screening tool for UK adults that turns symptoms and one overnight oxygen recording into a structured GP referral letter — so the conversation in a 10-minute appointment actually leads somewhere.

> ⚠️ NightCanary is **not a diagnostic tool**. The AI helps users describe their experience clearly; deterministic code applies validated clinical thresholds; the GP makes the call.

## The problem

- ~1.5 million UK adults have obstructive sleep apnoea. ~85% are undiagnosed.
- NHS sleep clinic wait times for diagnostic studies: 6–18 months.
- 10-minute GP appointments + unstructured complaints + symptoms that get blamed on stress = late presentation.
- Untreated OSA materially raises the risk of hypertension, stroke, type-2 diabetes, depression, and road accidents (DVLA reportable).

## What we built

A 5-step web app:

1. **Voice/text intake** — Whisper transcribes the user's spoken symptom description. They can also type.
2. **About-you form** — Age, sex, height/weight (live BMI calculator), neck circumference, blood pressure. Captures the deterministic STOP-BANG facts as structured data.
3. **AI-led conversation** — OpenAI asks focused follow-ups on the symptom items (snoring, observed apnoeas, daytime sleepiness, Epworth scenarios) with a live sidebar checklist that ticks each item as it gets confidently answered.
4. **Overnight pulse-oximetry** — CSV upload, live USB streaming via Web Serial, or a seeded sample for the demo.
5. **Results** — Plain-English explanation, overnight SpO₂ chart with desaturation markers, ElevenLabs read-aloud voice, and a NICE-aligned GP referral letter the user can download or email.

Two extras:

- **`/compare`** — healthy night vs moderate-OSA night side-by-side as a visual explainer.
- **`/record`** — live recording page that talks to a USB pulse oximeter via Web Serial API, with localStorage persistence so an overnight session survives a tab refresh.

## How AI is used (and how it isn't)

The deliberate split: **AI articulates. Code scores. GP decides.**

| Step | AI? | Why |
|---|---|---|
| Voice → text | OpenAI Whisper | Transcription |
| Symptom mapping (free-text → STOP-BANG/Epworth answers) | OpenAI | Structured extraction from natural language |
| Conversational follow-ups | OpenAI | Adaptive interview |
| Risk scoring | **No AI** | Deterministic TypeScript with cited clinical thresholds |
| ODI / T90 / mean / min calculation | **No AI** | Pure math over the time series |
| Patient explanation | OpenAI | Plain-English translation of the numbers |
| GP letter | OpenAI | Templated structure + variable clinical content |
| Read-aloud voice | ElevenLabs | Natural speech for the result summary and GP letter |

This split addresses the three failure modes that have killed other health-AI products: hallucinated diagnosis, model-version drift, and clinical liability.

## Clinical basis (all publicly documented thresholds)

- **STOP-BANG questionnaire** — Chung F. et al., Anesthesiology 2008;108(5):812-21.
- **Epworth Sleepiness Scale** — Johns MW., Sleep 1991;14(6):540-5.
- **Oxygen Desaturation Index bands** — AASM Manual for the Scoring of Sleep and Associated Events, 2017.
- **UK referral pathway** — NICE NG202: Obstructive sleep apnoea/hypopnoea syndrome and obesity hypoventilation syndrome in over 16s, 2021.

Full clinical-rules reference, decision tree, and known limitations: [`docs/clinical-rules.md`](docs/clinical-rules.md).

## Tech stack

- **Next.js 16** App Router with Turbopack
- **TypeScript** end-to-end
- **Tailwind v4** for styling, hand-rolled minimal UI components
- **OpenAI SDK** for chat, extraction, GP letter, patient explanation, and Whisper speech-to-text
- **ElevenLabs API** for read-aloud voice on the result summary and GP letter
- **Anthropic SDK** optional fallback provider
- **Recharts** for overnight SpO₂ visualisation
- **react-markdown + remark-gfm** for the GP letter and patient explanation
- **Vitest** for clinical-library unit tests (18/18 passing)
- **Web Serial API** for live USB pulse-oximeter streaming
- Deployed on **Cloudflare Workers** with the OpenNext Cloudflare adapter

## Quick start

```bash
cd night-canary
npm install
cp .env.example .env.local   # then add real keys
npm run dev
```

Open <http://localhost:3000>.

## Environment variables

| Var | Required? | Used for |
|---|---|---|
| `OPENAI_API_KEY` | Yes for AI demo | OpenAI chat, extraction, explanation, GP letter, and Whisper transcription |
| `OPENAI_MODEL` | No | OpenAI model override. Defaults to `gpt-4.1-mini` |
| `ELEVENLABS_API_KEY` | Yes for ElevenLabs voice | Generates read-aloud audio for the result summary and GP letter |
| `ELEVENLABS_VOICE_ID` | No | ElevenLabs voice override |
| `ELEVENLABS_MODEL` | No | ElevenLabs model override. Defaults to `eleven_multilingual_v2` |
| `AI_PROVIDER` | No | `openai` by default; can be set to `anthropic` |
| `ANTHROPIC_API_KEY` | Optional | Anthropic fallback provider |

Clients lazy-initialise, so the app builds cleanly without keys. Voice playback falls back to the browser speech engine if ElevenLabs is not configured.

## Scripts

```bash
npm run dev          # local dev server
npm run build        # production build
npm run preview      # Cloudflare Workers preview via OpenNext
npm run deploy       # deploy to Cloudflare Workers
npm run start        # production server
npm run test         # Vitest clinical-library suite
npm run lint         # eslint
```

## Repository layout

See [`CLAUDE.md`](CLAUDE.md) for a navigation guide, including which files do what and how to resume work after a break.

Demo material:
- [`docs/demo-script.md`](docs/demo-script.md) — 3-minute demo script + Q&A prep + failsafes
- [`docs/clinical-rules.md`](docs/clinical-rules.md) — thresholds, citations, and limitations
- [`docs/openai-usage.md`](docs/openai-usage.md) — exactly what OpenAI and ElevenLabs are and are not used for
- [`docs/submission.md`](docs/submission.md) — Devpost copy-paste pack and pre-flight checklist

## Known limitations (we're explicit about these)

1. Symptom extraction is LLM-driven and can be wrong. Defaults err toward under-calling risk (the safer error direction).
2. The seeded "moderate OSA" sample is synthetic — designed to look like a real pattern, but it isn't a real recording.
3. Consumer pulse oximeters are ±2% accurate. Thresholds are robust to this.
4. Pulse oximetry alone cannot distinguish central from obstructive apnoea — we describe findings as "consistent with sleep-disordered breathing".
5. AHI/ODI varies night-to-night — a single recording is a screening input, not a definitive measurement.
6. Sessions are in-memory and lost on cold starts — production would need Redis or a DB.

Full limitations table in `docs/clinical-rules.md` §7.

## License

Hackathon submission. All rights reserved by team.

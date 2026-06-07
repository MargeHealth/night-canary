# OpenAI and ElevenLabs usage

## OpenAI

OpenAI is used for:

- Whisper transcription in `/api/transcribe`.
- Adaptive intake chat in `/api/chat`.
- Conversation-to-structure extraction in `/api/score`.
- Plain-English patient explanation in `/api/score`.
- GP-letter drafting in `/api/letter`.

OpenAI is not used for:

- STOP-BANG scoring.
- Epworth scoring.
- Oxygen desaturation calculations.
- Final diagnosis.

The default provider is OpenAI. Set `AI_PROVIDER=anthropic` to use the optional Anthropic fallback.

## ElevenLabs

ElevenLabs is used only for text-to-speech through `/api/speak`. It reads the patient explanation or GP letter back to the user. If `ELEVENLABS_API_KEY` is missing, the client falls back to browser speech synthesis for demo continuity.

# NightCanary demo script

## 3-minute flow

1. Start on the home page and explain the promise: NightCanary helps a patient prepare a clearer GP conversation about possible obstructive sleep apnoea.
2. Click **Test voice** on the home page to prove ElevenLabs is wired before starting the long flow.
3. Open the assessment and record or type a short symptom story: loud snoring, daytime exhaustion, morning headaches, and a partner noticing pauses in breathing.
4. On the structured about-you form, use **Use demo profile** for the fast path, then explain that BMI, neck circumference, age, sex, and blood pressure are captured deterministically instead of guessed by the model.
5. In follow-ups, use the mic button or type an answer. The agent asks one question at a time and the checklist notes covered STOP-BANG/Epworth items live. For the fastest demo, click **Use demo answers**.
6. Use **Use demo sleep sample** if the live ring is not connected.
7. Show the result screen: risk band, oxygen trace, deterministic scores, plain-English explanation, and the GP letter.
8. Click **Read summary** or **Read aloud** to demonstrate ElevenLabs voice. If the ElevenLabs key is missing, the browser fallback still proves the voice interaction.
9. End on the safety line: this is not a diagnosis; it is a patient-prepared referral aid.

## Judge questions

- **Where is the medical logic?** In `lib/clinical/*`; the LLM does not calculate risk.
- **What does AI do?** Transcription, adaptive follow-up questions, structured extraction, plain-English explanation, and GP-letter drafting.
- **What does the IoT device add?** Overnight SpO2 readings that make the screening more concrete than symptoms alone.
- **What happens without hardware?** The seeded demo sample and CSV upload keep the product demonstrable.

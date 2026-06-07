# NightCanary demo script

## 3-minute flow

1. Start on the home page and explain the promise: NightCanary helps a patient prepare a clearer GP conversation about possible obstructive sleep apnoea.
2. Open the assessment and record or type a short symptom story: loud snoring, daytime exhaustion, morning headaches, and a partner noticing pauses in breathing.
3. Show the structured about-you form: BMI, neck circumference, age, sex, and blood pressure are captured deterministically instead of guessed by the model.
4. Let the AI ask one or two follow-up questions and point out the clinical coverage checklist.
5. Use the seeded moderate-OSA oximetry sample if the live ring is not connected.
6. Show the result screen: risk band, oxygen trace, deterministic scores, plain-English explanation, and the GP letter.
7. Click **Read summary** or **Read aloud** to demonstrate ElevenLabs voice. If the ElevenLabs key is missing, the browser fallback still proves the voice interaction.
8. End on the safety line: this is not a diagnosis; it is a patient-prepared referral aid.

## Judge questions

- **Where is the medical logic?** In `lib/clinical/*`; the LLM does not calculate risk.
- **What does AI do?** Transcription, adaptive follow-up questions, structured extraction, plain-English explanation, and GP-letter drafting.
- **What does the IoT device add?** Overnight SpO2 readings that make the screening more concrete than symptoms alone.
- **What happens without hardware?** The seeded demo sample and CSV upload keep the product demonstrable.

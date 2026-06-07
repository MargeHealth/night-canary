# Clinical rules

NightCanary is a screening and preparation tool, not a diagnostic device.

## Deterministic scoring

- STOP-BANG is calculated in `lib/clinical/stopbang.ts`.
- Epworth Sleepiness Scale is calculated in `lib/clinical/epworth.ts`.
- Oxygen Desaturation Index and SpO2 summary values are calculated in `lib/clinical/odi.ts` and `lib/clinical/spo2-stats.ts`.
- Overall risk combination is calculated in `lib/clinical/risk.ts`.

The LLM can extract answers from the conversation, but the score is calculated with TypeScript code. Structured form answers take precedence over LLM-extracted values for age, sex, BMI, neck circumference, and blood pressure.

## References

- STOP-BANG questionnaire: Chung F. et al., Anesthesiology 2008;108(5):812-21.
- Epworth Sleepiness Scale: Johns MW., Sleep 1991;14(6):540-5.
- Oxygen Desaturation Index bands: AASM Manual for the Scoring of Sleep and Associated Events.
- UK referral pathway context: NICE NG202.

## Limitations

- Pulse oximetry alone cannot diagnose obstructive sleep apnoea.
- Consumer oximeters have measurement error.
- A single night can understate or overstate usual symptoms.
- The tool does not distinguish central from obstructive events.
- The GP or sleep clinic remains responsible for diagnosis and treatment.

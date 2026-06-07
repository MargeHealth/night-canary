export type RiskBand = 'low' | 'moderate' | 'high'

export type CombinedRiskInput = {
  odi: number
  stopBangScore: number
  epworthTotal: number
  t90?: number       // % of recording with SpO2 < 90
  minSpo2?: number   // lowest single reading in the recording
}

export type CombinedRiskResult = {
  band: RiskBand
  reasons: string[]
}

export function combineRisk(input: CombinedRiskInput): CombinedRiskResult {
  const reasons: string[] = []

  const odiSevere = input.odi >= 30
  const odiHigh = input.odi >= 15
  const odiMod = input.odi >= 5

  const sbHighRisk = input.stopBangScore >= 5
  const sbHigh = input.stopBangScore >= 3
  const sbMod = input.stopBangScore >= 2

  const essHigh = input.epworthTotal >= 10
  const essMod = input.epworthTotal >= 8

  const t90Severe = (input.t90 ?? 0) >= 10
  const t90Mod = (input.t90 ?? 0) >= 5
  const minSpo2Critical = (input.minSpo2 ?? 100) < 85

  // ODI reasons
  if (odiSevere) reasons.push(`ODI ${input.odi.toFixed(1)}/hr is in the severe range (≥30)`)
  else if (odiHigh) reasons.push(`ODI ${input.odi.toFixed(1)}/hr indicates clinically significant overnight desaturations`)
  else if (odiMod) reasons.push(`ODI ${input.odi.toFixed(1)}/hr is borderline (5-15/hr)`)
  else reasons.push(`ODI ${input.odi.toFixed(1)}/hr is within normal range`)

  // T90 reasons
  if (t90Severe) reasons.push(`Oxygen saturation was below 90% for ${input.t90!.toFixed(1)}% of the recording`)
  else if (t90Mod) reasons.push(`Oxygen saturation was below 90% for ${input.t90!.toFixed(1)}% of the recording (borderline)`)

  // Min SpO2 reasons
  if (minSpo2Critical) reasons.push(`Lowest recorded SpO₂ of ${input.minSpo2!.toFixed(0)}% indicates substantial desaturation events`)

  // STOP-BANG reasons
  if (sbHighRisk) reasons.push(`STOP-BANG score of ${input.stopBangScore} indicates high OSA risk`)
  else if (sbHigh) reasons.push(`STOP-BANG score of ${input.stopBangScore} indicates intermediate OSA risk`)
  else if (sbMod) reasons.push(`STOP-BANG score of ${input.stopBangScore} is borderline`)

  // Epworth reasons
  if (essHigh) reasons.push(`Epworth ${input.epworthTotal}/24 indicates excessive daytime sleepiness`)
  else if (essMod) reasons.push(`Epworth ${input.epworthTotal}/24 is borderline`)

  // --- Risk band logic (clinically defensible) ---
  // HIGH: any one of:
  //   - severe ODI (≥30) on its own
  //   - critically low min SpO2 (<85%)
  //   - moderate ODI (≥15) plus either symptomatic indicator
  //   - STOP-BANG high (≥5) plus moderate ODI
  let band: RiskBand
  if (
    odiSevere ||
    minSpo2Critical ||
    (odiHigh && (sbHigh || essHigh)) ||
    (sbHighRisk && odiMod)
  ) {
    band = 'high'
  } else if (
    odiHigh ||
    odiMod ||
    t90Mod ||
    sbHigh ||
    essHigh ||
    (sbMod && essMod)
  ) {
    band = 'moderate'
  } else {
    band = 'low'
  }

  return { band, reasons }
}

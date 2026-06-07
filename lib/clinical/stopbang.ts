export type StopBangAnswers = {
  snoreLoudly: boolean
  tiredDaytime: boolean
  observedApnea: boolean
  highBP: boolean
  bmiOver35: boolean
  ageOver50: boolean
  neckOver40cm: boolean
  male: boolean
}

export type StopBangRisk = 'low' | 'intermediate' | 'high'

export type StopBangResult = {
  score: number
  risk: StopBangRisk
  positiveItems: string[]
}

const LABELS: Record<keyof StopBangAnswers, string> = {
  snoreLoudly: 'Snores loudly',
  tiredDaytime: 'Daytime tiredness/sleepiness',
  observedApnea: 'Observed pauses in breathing during sleep',
  highBP: 'Diagnosed or treated for high blood pressure',
  bmiOver35: 'BMI over 35',
  ageOver50: 'Age over 50',
  neckOver40cm: 'Neck circumference over 40 cm',
  male: 'Male',
}

export function scoreStopBang(answers: StopBangAnswers): StopBangResult {
  const keys = Object.keys(answers) as (keyof StopBangAnswers)[]
  const positive = keys.filter(k => answers[k])
  const score = positive.length
  let risk: StopBangRisk
  if (score <= 2) risk = 'low'
  else if (score <= 4) risk = 'intermediate'
  else risk = 'high'
  return { score, risk, positiveItems: positive.map(k => LABELS[k]) }
}

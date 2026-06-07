export const EPWORTH_SCENARIOS = [
  'Sitting and reading',
  'Watching TV',
  'Sitting inactive in a public place (e.g. in a meeting or theatre)',
  'As a passenger in a car for an hour without a break',
  'Lying down to rest in the afternoon when circumstances permit',
  'Sitting and talking to someone',
  'Sitting quietly after a lunch without alcohol',
  'In a car, while stopped for a few minutes in traffic',
] as const

export type EpworthBand = 'normal' | 'mild' | 'moderate' | 'severe'

export type EpworthResult = {
  total: number
  band: EpworthBand
}

export function scoreEpworth(answers: number[]): EpworthResult {
  if (answers.length !== 8) throw new Error('Epworth requires exactly 8 answers')
  for (const a of answers) {
    if (!Number.isInteger(a) || a < 0 || a > 3) {
      throw new Error('Each Epworth answer must be 0, 1, 2, or 3')
    }
  }
  const total = answers.reduce((s, a) => s + a, 0)
  let band: EpworthBand
  if (total <= 7) band = 'normal'
  else if (total <= 10) band = 'mild'
  else if (total <= 15) band = 'moderate'
  else band = 'severe'
  return { total, band }
}

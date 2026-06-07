'use client'
import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calculator } from 'lucide-react'
import type { WizardCtx } from './Wizard'

type Unit = 'metric' | 'imperial'

function computeBmi(unit: Unit, vals: {
  heightCm?: number; weightKg?: number; feet?: number; inches?: number; pounds?: number
}): number | null {
  let h: number, w: number
  if (unit === 'metric') {
    if (!vals.heightCm || !vals.weightKg) return null
    h = vals.heightCm / 100
    w = vals.weightKg
  } else {
    const totalInches = (vals.feet ?? 0) * 12 + (vals.inches ?? 0)
    if (!totalInches || !vals.pounds) return null
    h = (totalInches * 2.54) / 100
    w = vals.pounds * 0.45359237
  }
  if (h <= 0 || w <= 0) return null
  return Math.round((w / (h * h)) * 10) / 10
}

function bmiClass(bmi: number): string {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Healthy weight'
  if (bmi < 30) return 'Overweight'
  if (bmi < 35) return 'Obese (class I)'
  if (bmi < 40) return 'Obese (class II)'
  return 'Obese (class III)'
}

export function AboutYouStep({ ctx }: { ctx: WizardCtx }) {
  const [age, setAge] = useState<string>('')
  const [sex, setSex] = useState<'male' | 'female' | 'na' | null>(null)
  const [unit, setUnit] = useState<Unit>('metric')
  const [heightCm, setHeightCm] = useState<string>('')
  const [weightKg, setWeightKg] = useState<string>('')
  const [feet, setFeet] = useState<string>('')
  const [inches, setInches] = useState<string>('')
  const [pounds, setPounds] = useState<string>('')
  const [neckCm, setNeckCm] = useState<string>('')
  const [highBP, setHighBP] = useState<'yes' | 'no' | 'unsure' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const bmi = useMemo(() => computeBmi(unit, {
    heightCm: heightCm ? Number(heightCm) : undefined,
    weightKg: weightKg ? Number(weightKg) : undefined,
    feet: feet ? Number(feet) : undefined,
    inches: inches ? Number(inches) : undefined,
    pounds: pounds ? Number(pounds) : undefined,
  }), [unit, heightCm, weightKg, feet, inches, pounds])

  const canSubmit = age && sex && bmi !== null && highBP

  async function submit() {
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/about', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: ctx.sessionId,
          age: age ? Number(age) : undefined,
          male: sex === 'male' ? true : sex === 'female' ? false : undefined,
          bmi,
          neckCm: neckCm ? Number(neckCm) : undefined,
          highBP: highBP === 'yes' ? true : highBP === 'no' ? false : undefined,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (data.sessionId) ctx.setSessionId(data.sessionId)
      ctx.next()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  const bmiTone =
    bmi === null ? 'text-slate-400' :
    bmi >= 35 ? 'text-amber-700' :
    bmi >= 30 ? 'text-amber-600' :
    bmi < 18.5 ? 'text-blue-600' :
    'text-emerald-700'

  return (
    <Card className="p-5 sm:p-6 space-y-5">
      <p className="text-sm text-slate-600">
        These are the basic facts the assessment needs — a few seconds to fill in,
        and the conversation in the next step can focus on how you&apos;ve been feeling.
      </p>

      {/* Age */}
      <Field label="How old are you?" hint="Years">
        <input
          type="number"
          inputMode="numeric"
          placeholder="e.g. 47"
          value={age}
          onChange={e => setAge(e.target.value)}
          className="w-32 p-2.5 border border-slate-300 rounded text-slate-900 bg-white placeholder:text-slate-400 text-base"
        />
      </Field>

      {/* Sex */}
      <Field label="Sex" hint="STOP-BANG asks because OSA is more common in men">
        <div className="flex flex-wrap gap-2">
          <ToggleButton selected={sex === 'male'} onClick={() => setSex('male')}>Male</ToggleButton>
          <ToggleButton selected={sex === 'female'} onClick={() => setSex('female')}>Female</ToggleButton>
          <ToggleButton selected={sex === 'na'} onClick={() => setSex('na')}>Prefer not to say</ToggleButton>
        </div>
      </Field>

      {/* BMI */}
      <Field label="Height and weight" hint="Used to calculate BMI">
        <div className="space-y-3">
          <div className="inline-flex p-0.5 rounded-md bg-slate-100 text-xs">
            <button
              type="button"
              onClick={() => setUnit('metric')}
              className={`px-3 py-1 rounded ${unit === 'metric' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
            >
              Metric
            </button>
            <button
              type="button"
              onClick={() => setUnit('imperial')}
              className={`px-3 py-1 rounded ${unit === 'imperial' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
            >
              Imperial
            </button>
          </div>

          {unit === 'metric' ? (
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <SubField label="Height (cm)">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="175"
                  value={heightCm}
                  onChange={e => setHeightCm(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-slate-900 bg-white placeholder:text-slate-400 text-sm"
                />
              </SubField>
              <SubField label="Weight (kg)">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="75"
                  value={weightKg}
                  onChange={e => setWeightKg(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-slate-900 bg-white placeholder:text-slate-400 text-sm"
                />
              </SubField>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 max-w-md">
              <SubField label="Feet">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="5"
                  value={feet}
                  onChange={e => setFeet(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-slate-900 bg-white placeholder:text-slate-400 text-sm"
                />
              </SubField>
              <SubField label="Inches">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="9"
                  value={inches}
                  onChange={e => setInches(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-slate-900 bg-white placeholder:text-slate-400 text-sm"
                />
              </SubField>
              <SubField label="Pounds">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="165"
                  value={pounds}
                  onChange={e => setPounds(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-slate-900 bg-white placeholder:text-slate-400 text-sm"
                />
              </SubField>
            </div>
          )}

          {bmi !== null && (
            <div className="flex items-center gap-3 mt-2 p-3 bg-slate-50 rounded">
              <Calculator className="w-4 h-4 text-slate-400" />
              <div className="flex-1">
                <span className="text-xs uppercase text-slate-500 tracking-wide mr-2">BMI</span>
                <span className={`text-xl font-bold tabular-nums ${bmiTone}`}>{bmi}</span>
                <span className={`text-xs ${bmiTone} ml-2`}>{bmiClass(bmi)}</span>
              </div>
              {bmi >= 35 && (
                <span className="text-[10px] font-semibold uppercase text-amber-700 bg-amber-100 px-2 py-1 rounded">
                  Stop-bang +
                </span>
              )}
            </div>
          )}
        </div>
      </Field>

      {/* Neck — optional */}
      <Field label="Neck circumference (optional)" hint="STOP-BANG flags above 40 cm. Skip if unknown.">
        <input
          type="number"
          inputMode="decimal"
          placeholder="cm"
          value={neckCm}
          onChange={e => setNeckCm(e.target.value)}
          className="w-32 p-2.5 border border-slate-300 rounded text-slate-900 bg-white placeholder:text-slate-400 text-base"
        />
      </Field>

      {/* High BP */}
      <Field label="Have you been diagnosed with high blood pressure?" hint="Or are you taking medication for it">
        <div className="flex flex-wrap gap-2">
          <ToggleButton selected={highBP === 'yes'} onClick={() => setHighBP('yes')}>Yes</ToggleButton>
          <ToggleButton selected={highBP === 'no'} onClick={() => setHighBP('no')}>No</ToggleButton>
          <ToggleButton selected={highBP === 'unsure'} onClick={() => setHighBP('unsure')}>Not sure</ToggleButton>
        </div>
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="pt-2 border-t border-slate-100">
        <Button
          onClick={submit}
          disabled={!canSubmit || submitting}
          size="lg"
          className="w-full"
        >
          {submitting ? 'Saving...' : 'Continue to symptoms'}
        </Button>
        {!canSubmit && (
          <p className="text-xs text-slate-500 mt-2 text-center">
            Fill in age, sex, height/weight, and blood pressure to continue. Neck is optional.
          </p>
        )}
      </div>
    </Card>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block">
        <span className="text-sm font-medium text-slate-900 block">{label}</span>
        {hint && <span className="text-xs text-slate-500 block mb-2">{hint}</span>}
        <div className={hint ? '' : 'mt-2'}>
          {children}
        </div>
      </label>
    </div>
  )
}

function SubField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-slate-600 mb-1 block">{label}</span>
      {children}
    </label>
  )
}

function ToggleButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-md text-sm border transition-colors ${
        selected
          ? 'bg-slate-900 border-slate-900 text-white'
          : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
      }`}
    >
      {children}
    </button>
  )
}

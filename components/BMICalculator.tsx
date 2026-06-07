'use client'
import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calculator, Send } from 'lucide-react'

type Unit = 'metric' | 'imperial'

export type BMIResult = {
  bmi: number
  classification: string
  summary: string
}

function classify(bmi: number): string {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Healthy weight'
  if (bmi < 30) return 'Overweight'
  if (bmi < 35) return 'Obese (class I)'
  if (bmi < 40) return 'Obese (class II)'
  return 'Obese (class III)'
}

function calculate(opts: {
  unit: Unit
  heightCm?: number
  weightKg?: number
  feet?: number
  inches?: number
  pounds?: number
}): BMIResult | null {
  let h: number
  let w: number
  if (opts.unit === 'metric') {
    if (!opts.heightCm || !opts.weightKg) return null
    h = opts.heightCm / 100
    w = opts.weightKg
  } else {
    const totalInches = (opts.feet ?? 0) * 12 + (opts.inches ?? 0)
    if (!totalInches || !opts.pounds) return null
    h = (totalInches * 2.54) / 100
    w = opts.pounds * 0.45359237
  }
  if (h <= 0 || w <= 0) return null
  const bmi = Math.round((w / (h * h)) * 10) / 10
  const classification = classify(bmi)
  return {
    bmi,
    classification,
    summary: `BMI ${bmi} (${classification.toLowerCase()})`,
  }
}

export function BMICalculator({ onSend }: { onSend?: (msg: string) => void }) {
  const [unit, setUnit] = useState<Unit>('metric')
  const [heightCm, setHeightCm] = useState<string>('')
  const [weightKg, setWeightKg] = useState<string>('')
  const [feet, setFeet] = useState<string>('')
  const [inches, setInches] = useState<string>('')
  const [pounds, setPounds] = useState<string>('')

  const result = useMemo(() => {
    return calculate({
      unit,
      heightCm: heightCm ? Number(heightCm) : undefined,
      weightKg: weightKg ? Number(weightKg) : undefined,
      feet: feet ? Number(feet) : undefined,
      inches: inches ? Number(inches) : undefined,
      pounds: pounds ? Number(pounds) : undefined,
    })
  }, [unit, heightCm, weightKg, feet, inches, pounds])

  const tone =
    !result ? 'text-slate-400' :
    result.bmi >= 35 ? 'text-amber-700' :
    result.bmi >= 30 ? 'text-amber-600' :
    result.bmi < 18.5 ? 'text-blue-600' :
    'text-emerald-700'

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="w-4 h-4 text-slate-500" />
        <h4 className="text-sm font-semibold text-slate-900">BMI calculator</h4>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        BMI is one of the eight STOP-BANG items. Use this if you don&apos;t know yours.
      </p>

      {/* Unit toggle */}
      <div className="inline-flex p-0.5 rounded-md bg-slate-100 mb-4 text-xs">
        <button
          onClick={() => setUnit('metric')}
          className={`px-3 py-1 rounded ${unit === 'metric' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
        >
          Metric
        </button>
        <button
          onClick={() => setUnit('imperial')}
          className={`px-3 py-1 rounded ${unit === 'imperial' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
        >
          Imperial
        </button>
      </div>

      {/* Inputs */}
      {unit === 'metric' ? (
        <div className="space-y-3">
          <Field label="Height (cm)">
            <input
              type="number"
              inputMode="decimal"
              placeholder="175"
              value={heightCm}
              onChange={e => setHeightCm(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded text-slate-900 bg-white placeholder:text-slate-400 text-sm"
            />
          </Field>
          <Field label="Weight (kg)">
            <input
              type="number"
              inputMode="decimal"
              placeholder="75"
              value={weightKg}
              onChange={e => setWeightKg(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded text-slate-900 bg-white placeholder:text-slate-400 text-sm"
            />
          </Field>
        </div>
      ) : (
        <div className="space-y-3">
          <Field label="Height">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="5"
                  value={feet}
                  onChange={e => setFeet(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-slate-900 bg-white placeholder:text-slate-400 text-sm"
                />
                <div className="text-[10px] text-slate-500 mt-0.5">feet</div>
              </div>
              <div>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="9"
                  value={inches}
                  onChange={e => setInches(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-slate-900 bg-white placeholder:text-slate-400 text-sm"
                />
                <div className="text-[10px] text-slate-500 mt-0.5">inches</div>
              </div>
            </div>
          </Field>
          <Field label="Weight (lbs)">
            <input
              type="number"
              inputMode="decimal"
              placeholder="165"
              value={pounds}
              onChange={e => setPounds(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded text-slate-900 bg-white placeholder:text-slate-400 text-sm"
            />
          </Field>
        </div>
      )}

      {/* Result */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-slate-500">Your BMI</span>
          {result && result.bmi >= 35 && (
            <span className="text-[10px] font-semibold uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              Stop-bang positive
            </span>
          )}
        </div>
        <div className={`text-3xl font-bold tabular-nums ${tone} mt-1`}>
          {result ? result.bmi : '—'}
        </div>
        <div className={`text-xs ${tone} mt-0.5`}>
          {result ? result.classification : 'Enter height and weight'}
        </div>

        {result && onSend && (
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-3"
            onClick={() => onSend(`My BMI is ${result.bmi} — ${result.classification.toLowerCase()}.`)}
          >
            <Send className="w-3 h-3 mr-2" />
            Send to chat
          </Button>
        )}
      </div>
    </Card>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-slate-600 mb-1 block">{label}</span>
      {children}
    </label>
  )
}

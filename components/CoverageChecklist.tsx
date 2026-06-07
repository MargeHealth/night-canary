'use client'
import { Card } from '@/components/ui/card'
import { Check, Circle } from 'lucide-react'

type Item = { code: string; label: string }

const STOP_BANG: Item[] = [
  { code: 'S', label: 'Snoring loudly' },
  { code: 'T', label: 'Daytime tiredness' },
  { code: 'O', label: 'Observed apnoeas' },
  { code: 'P', label: 'High blood pressure' },
  { code: 'B', label: 'BMI over 35' },
  { code: 'A', label: 'Age over 50' },
  { code: 'N', label: 'Neck over 40cm' },
  { code: 'G', label: 'Sex' },
]

const EPWORTH: Item[] = [
  { code: 'E1', label: 'Reading' },
  { code: 'E2', label: 'Watching TV' },
  { code: 'E3', label: 'Sitting in public' },
  { code: 'E4', label: 'Passenger 1hr' },
  { code: 'E5', label: 'Lying afternoon' },
  { code: 'E6', label: 'Talking' },
  { code: 'E7', label: 'After lunch' },
  { code: 'E8', label: 'Stopped in traffic' },
]

export function CoverageChecklist({ covered }: { covered: string[] }) {
  const set = new Set(covered.map(c => c.toUpperCase()))
  const sbDone = STOP_BANG.filter(i => set.has(i.code)).length
  const essDone = EPWORTH.filter(i => set.has(i.code)).length

  return (
    <Card className="p-5 sticky top-6">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-slate-900">Clinical coverage</h4>
        <p className="text-xs text-slate-500 mt-1">
          AI is mapping the conversation to validated screening items in real time.
        </p>
      </div>

      <Section title="STOP-BANG" done={sbDone} total={STOP_BANG.length} items={STOP_BANG} covered={set} />
      <Section title="Epworth Sleepiness Scale" done={essDone} total={EPWORTH.length} items={EPWORTH} covered={set} />

      <p className="text-[10px] text-slate-400 mt-4 leading-tight">
        Chung 2008 · Johns 1991. Scoring is deterministic and runs in code, not in the model.
      </p>
    </Card>
  )
}

function Section({ title, done, total, items, covered }: {
  title: string
  done: number
  total: number
  items: Item[]
  covered: Set<string>
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-600">{title}</span>
        <span className="text-xs font-mono text-slate-500">{done}/{total}</span>
      </div>
      <ul className="space-y-1.5">
        {items.map(item => {
          const isDone = covered.has(item.code)
          return (
            <li key={item.code} className="flex items-center gap-2 text-xs">
              {isDone ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              )}
              <span className={isDone ? 'text-slate-800' : 'text-slate-400'}>
                {item.label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

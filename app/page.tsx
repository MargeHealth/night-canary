import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ReadAloudButton } from '@/components/ReadAloudButton'
import { BrandLogo } from '@/components/BrandLogo'
import {
  Mic,
  Activity,
  FileText,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react'

export default function Landing() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* ============ NAV ============ */}
      <nav className="border-b border-slate-200 bg-white/70 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <BrandLogo compact />
          <div className="hidden sm:flex items-center gap-1 text-sm">
            <Link href="/compare" className="px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100">
              Compare
            </Link>
            <Link href="/record" className="px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100">
              Record
            </Link>
            <Link href="/assess" className="ml-1">
              <Button size="sm">Start check</Button>
            </Link>
          </div>
          <Link href="/assess" className="sm:hidden">
            <Button size="sm">Start</Button>
          </Link>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white">
        {/* subtle decorative grid */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #0f172a 1px, transparent 1px), linear-gradient(to bottom, #0f172a 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-200 bg-teal-50 text-teal-800 text-xs font-medium mb-5">
                <Stethoscope className="w-3.5 h-3.5" />
                For UK adults, built for the NHS pathway
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.05]">
                Catch sleep apnoea
                <br />
                <span className="text-teal-700">before it catches you.</span>
              </h1>
              <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                1 in 25 UK adults have obstructive sleep apnoea. <strong className="text-slate-900">85% don&apos;t know.</strong> In 5 minutes,
                NightCanary turns your symptoms and one overnight oxygen recording
                into a structured letter your GP can act on in a 10-minute appointment.
              </p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Link href="/assess">
                  <Button size="lg" className="w-full sm:w-auto px-6">
                    Take the 5-minute check
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/compare">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto px-6">
                    See what OSA looks like
                  </Button>
                </Link>
                <ReadAloudButton
                  text="NightCanary voice is ready. Your sleep screening summary and GP letter can be read aloud."
                  label="Test voice"
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                />
              </div>
              <p className="mt-5 text-xs text-slate-500 max-w-md">
                Not a diagnosis. Not a replacement for a doctor. A structured handoff between you and your GP.
              </p>
            </div>

            {/* Hero illustration: stylised SpO2 trace */}
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-br from-teal-100 via-white to-amber-50 rounded-3xl blur-2xl opacity-60" />
              <Card className="relative p-5 sm:p-6 shadow-xl border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Activity className="w-3.5 h-3.5" />
                    Overnight oxygen — eight hours
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">SpO₂ %</span>
                </div>
                <SpO2HeroChart />
                <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-slate-100">
                  <Stat label="ODI" value="22/hr" sub="moderate" tone="warn" />
                  <Stat label="Min SpO₂" value="78%" sub="critical" tone="warn" />
                  <Stat label="Risk" value="HIGH" sub="for review" tone="bad" />
                </div>
              </Card>
              <p className="text-[11px] text-center text-slate-500 mt-3">
                A real-pattern moderate-OSA night, scored by NightCanary
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-14 grid grid-cols-2 lg:grid-cols-4 gap-8">
          <BigStat n="1 in 25" label="UK adults have OSA" />
          <BigStat n="85%" label="of them don't know" />
          <BigStat n="6–18 mo" label="NHS sleep clinic wait" />
          <BigStat n="2× stroke" label="risk if untreated" />
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">How it works</h2>
            <p className="mt-3 text-slate-600">
              Symptoms, quick profile, one overnight recording. No login. No data leaves your session.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            <StepCard
              step="1"
              icon={<Mic className="w-5 h-5" />}
              title="Tell us how you feel"
              body="Speak naturally — tiredness, snoring, things your partner has noticed. We transcribe and ask the right follow-ups."
            />
            <StepCard
              step="2"
              icon={<Activity className="w-5 h-5" />}
              title="Record one night"
              body="Plug in any consumer pulse oximeter. Live readings stream into the browser and persist if you refresh."
            />
            <StepCard
              step="3"
              icon={<FileText className="w-5 h-5" />}
              title="Walk in prepared"
              body="A NICE-aligned referral letter, ready to email or download. Your GP gets a structured story, not a vague worry."
            />
          </div>
        </div>
      </section>

      {/* ============ TRUST / SAFETY ============ */}
      <section className="bg-gradient-to-br from-slate-50 to-slate-100 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-medium mb-4">
              <ShieldCheck className="w-3.5 h-3.5" />
              The safe lane for AI in health
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              AI articulates. Code scores. Your GP decides.
            </h2>
            <p className="mt-4 text-slate-700 leading-relaxed">
              NightCanary never assigns your risk band. The classification is a deterministic, auditable
              function in TypeScript — using the same thresholds NHS sleep clinics screen by.
              The AI&apos;s only job is helping you describe your symptoms clearly and writing
              the letter for you.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-slate-700">
              <Tick>STOP-BANG questionnaire (Chung 2008)</Tick>
              <Tick>Epworth Sleepiness Scale (Johns 1991)</Tick>
              <Tick>ODI severity bands per AASM 2017 + NICE NG202</Tick>
              <Tick>Every threshold and limitation documented openly</Tick>
            </ul>
          </div>
          <Card className="p-6 bg-white border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-wider mb-3">
              <FileText className="w-3.5 h-3.5" /> Excerpt — your GP letter
            </div>
            <div className="font-mono text-[12px] text-slate-700 leading-relaxed space-y-2">
              <p>
                <strong>Re:</strong> Self-prepared symptom history for GP review
              </p>
              <p>
                The patient reports loud snoring observed by their partner, witnessed pauses in
                breathing during sleep, persistent daytime tiredness (Epworth 16/24), and morning headaches.
              </p>
              <p>
                Home overnight oximetry shows an Oxygen Desaturation Index of 22/hr, mean SpO₂ 92%,
                minimum 78%, T90 4.6%. The pattern is consistent with moderate obstructive
                sleep apnoea.
              </p>
              <p>
                STOP-BANG score 6/8 indicates high pre-test probability. Referral to a sleep clinic
                for confirmatory study is suggested per NICE NG202.
              </p>
              <p className="text-slate-400">
                — Prepared by the patient using NightCanary, a self-screening tool. This is not a clinical diagnosis.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Five minutes. Honest answers.
          </h2>
          <p className="mt-3 text-slate-300 max-w-xl mx-auto">
            If the pattern is there, the letter goes with you to your GP.
            If it isn&apos;t, you sleep easier tonight.
          </p>
          <Link href="/assess" className="inline-block mt-7">
            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 px-7">
              Start the check
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <BrandLogo compact markClassName="h-6 w-6" textClassName="text-xs text-slate-600" />
            <span>· VibeHack London 2026</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/compare" className="hover:text-slate-900">Compare</Link>
            <Link href="/record" className="hover:text-slate-900">Record</Link>
            <Link href="/assess" className="hover:text-slate-900">Assessment</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}

/* =================== Sub-components =================== */

function BigStat({ n, label }: { n: string; label: string }) {
  return (
    <div className="text-center sm:text-left">
      <div className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">{n}</div>
      <div className="text-xs sm:text-sm text-slate-600 mt-1">{label}</div>
    </div>
  )
}

function StepCard({ step, icon, title, body }: { step: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <Card className="p-6 border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-xs font-mono text-slate-400">Step {step}</span>
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{body}</p>
    </Card>
  )
}

function Tick({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
      <span>{children}</span>
    </li>
  )
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: 'ok' | 'warn' | 'bad' }) {
  const valueColor = tone === 'bad' ? 'text-red-600' : tone === 'warn' ? 'text-amber-700' : 'text-emerald-700'
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`text-base font-semibold tabular-nums ${valueColor}`}>{value}</div>
      <div className="text-[10px] text-slate-500 capitalize">{sub}</div>
    </div>
  )
}

/* Stylised hero chart — pure SVG so it loads instantly and animates subtly. */
function SpO2HeroChart() {
  // Build a path that sits around y=20 (representing ~97% SpO2) and dips dramatically.
  // viewBox 400 x 110. y=0 is top, y=110 bottom. We map SpO2 100 → y=5, 75 → y=100.
  const ySpo2 = (s: number) => 5 + ((100 - s) / 25) * 95

  const pts: Array<[number, number]> = []
  const N = 80
  for (let i = 0; i < N; i++) {
    const x = (i / (N - 1)) * 400
    // Baseline ~97 with small noise
    let s = 97 + Math.sin(i * 0.7) * 0.6
    // Dips at regular intervals
    if ((i + 3) % 11 === 0) s = 87
    if ((i + 7) % 11 === 0) s = 82 + (i % 4)
    if (i === 24) s = 78
    if (i === 47) s = 80
    if (i === 63) s = 79
    pts.push([x, ySpo2(s)])
  }
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')

  return (
    <div className="relative">
      <svg viewBox="0 0 400 110" className="w-full h-32 sm:h-36">
        <defs>
          <linearGradient id="spo2gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0f766e" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0f766e" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y axis labels */}
        <text x="2" y="14" fontSize="7" fill="#94a3b8">100</text>
        <text x="2" y="62" fontSize="7" fill="#94a3b8">90</text>
        <text x="2" y="105" fontSize="7" fill="#94a3b8">75</text>

        {/* 90% reference line */}
        <line x1="18" y1="62" x2="400" y2="62" stroke="#dc2626" strokeWidth="0.5" strokeDasharray="3,3" />
        <text x="378" y="60" fontSize="7" fill="#dc2626">90%</text>

        {/* Area under curve */}
        <path d={`${path} L 400 110 L 0 110 Z`} fill="url(#spo2gradient)" />

        {/* Main trace */}
        <path d={path} fill="none" stroke="#0f766e" strokeWidth="1.5" strokeLinejoin="round" />

        {/* Markers at dip nadirs */}
        {[[120, ySpo2(78)], [235, ySpo2(80)], [315, ySpo2(79)]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2" fill="#dc2626" />
        ))}
      </svg>
    </div>
  )
}

'use client'
import { Wizard, type WizardStep } from '@/components/Wizard'
import { VoiceIntake } from '@/components/VoiceIntake'
import { AboutYouStep } from '@/components/AboutYouStep'
import { ChatFollowups } from '@/components/ChatFollowups'
import { PulseOxStep } from '@/components/PulseOxStep'
import { ResultsStep } from '@/components/ResultsStep'

const steps: WizardStep[] = [
  { title: 'Tell us how you have been feeling', render: ctx => <VoiceIntake ctx={ctx} /> },
  { title: 'A few quick facts about you', render: ctx => <AboutYouStep ctx={ctx} /> },
  { title: 'A few quick follow-ups', render: ctx => <ChatFollowups ctx={ctx} /> },
  { title: 'Now your overnight sleep data', render: ctx => <PulseOxStep ctx={ctx} /> },
  { title: 'Your results', render: ctx => <ResultsStep ctx={ctx} /> },
]

export default function AssessPage() {
  return <Wizard steps={steps} />
}

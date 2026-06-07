import type { Metadata } from 'next'
import { ScreeningDashboard } from '@/components/ScreeningDashboard'

export const metadata: Metadata = {
  title: 'Live Screening',
  description: 'Watch NightCanary live SpO2, pulse, and sensor signal readings from the Marge Health ring.',
}

export default function ScreeningPage() {
  return <ScreeningDashboard />
}

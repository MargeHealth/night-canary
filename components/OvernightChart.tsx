'use client'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts'
import type { PulseOxReading } from '@/lib/pulseox/types'

export function OvernightChart({ readings }: { readings: PulseOxReading[] }) {
  const stride = Math.max(1, Math.floor(readings.length / 600))
  const data = readings.filter((_, i) => i % stride === 0).map(r => ({
    time: new Date(r.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    spo2: r.spo2,
  }))
  return (
    <div className="w-full h-48 sm:h-64">
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="time" tick={{ fontSize: 10 }} minTickGap={40} />
          <YAxis
            domain={[70, 100]}
            tick={{ fontSize: 10 }}
            label={{ value: 'SpO₂ %', angle: -90, position: 'insideLeft', fontSize: 10 }}
          />
          <Tooltip />
          <ReferenceLine y={90} stroke="#dc2626" strokeDasharray="3 3" />
          <Line type="monotone" dataKey="spo2" stroke="#0f766e" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

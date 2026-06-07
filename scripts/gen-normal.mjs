import { writeFileSync } from 'fs'

const start = Date.UTC(2026, 5, 5, 22, 0, 0)
const lines = ['timestamp,spo2,pulse_rate']
for (let i = 0; i < 7200; i++) {
  const ts = start + i * 4000
  const spo2 = 96 + Math.sin(i / 200) * 1.2 + (Math.random() - 0.5) * 0.6
  const hr = 58 + Math.sin(i / 300) * 4 + (Math.random() - 0.5) * 2
  lines.push(`${ts},${spo2.toFixed(1)},${hr.toFixed(0)}`)
}
writeFileSync('public/samples/normal-night.csv', lines.join('\n'))
console.log('Wrote normal-night.csv')

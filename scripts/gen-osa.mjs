import { writeFileSync } from 'fs'

const start = Date.UTC(2026, 5, 5, 22, 0, 0)
const lines = ['timestamp,spo2,pulse_rate']

const baseline = 97
let inDip = false
let dipFramesLeft = 0
let dipDepth = 0
const dipDurationFrames = 8

for (let i = 0; i < 7200; i++) {
  const ts = start + i * 4000

  if (!inDip && Math.random() < 1 / 160) {
    inDip = true
    dipFramesLeft = dipDurationFrames
    dipDepth = 10 + Math.random() * 6
  }

  let spo2
  if (inDip) {
    const progress = 1 - dipFramesLeft / dipDurationFrames
    spo2 = baseline - dipDepth * Math.sin(progress * Math.PI)
    dipFramesLeft--
    if (dipFramesLeft <= 0) inDip = false
  } else {
    spo2 = baseline + (Math.random() - 0.5) * 0.6
  }
  const hr = 60 + (inDip ? 18 : 0) + Math.sin(i / 300) * 4 + (Math.random() - 0.5) * 2
  lines.push(`${ts},${spo2.toFixed(1)},${hr.toFixed(0)}`)
}
writeFileSync('public/samples/moderate-osa-night.csv', lines.join('\n'))
console.log('Wrote moderate-osa-night.csv')

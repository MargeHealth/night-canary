# Devpost copy

## Project name

NightCanary

## Elevator pitch

NightCanary turns sleep symptoms and overnight oxygen data into a GP-ready referral pack, using AI for conversation and voice while deterministic code scores OSA risk.

## What it does

NightCanary helps UK adults self-screen for possible obstructive sleep apnoea. It captures symptoms by voice or text, asks focused follow-ups, accepts pulse-oximetry data from CSV, sample data, or a live device, then produces a plain-English risk explanation and a GP referral-preparation letter.

## How we built it

The app uses Next.js, TypeScript, OpenAI, ElevenLabs, deterministic clinical scoring libraries, Recharts, and Web Serial for live pulse-oximeter data. It deploys to Cloudflare Workers through the OpenNext Cloudflare adapter.

## Safety position

NightCanary does not diagnose. AI helps users explain symptoms and prepare paperwork; deterministic code calculates screening scores; clinicians make the diagnosis.

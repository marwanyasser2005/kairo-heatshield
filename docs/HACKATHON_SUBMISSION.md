# KAIRO HeatShield — Hackathon submission

## Project name

KAIRO HeatShield — Urban Heat Exposure & Resilience Intelligence

## One-line pitch

KAIRO turns hyperlocal temperature intelligence into explainable hotspot priorities and assessment-first urban resilience actions.

## Problem

Cities can obtain temperature surfaces yet still lack a defensible workflow for finding persistent and anomalous heat, connecting it to urban context, deciding which zones deserve attention, and communicating the evidence without causal overclaiming.

## Solution

KAIRO implements **Detect → Analyze → Explain → Prioritize → Act**. It combines a verified FortyGuard heatmap activity with a normalized spatial model, robust anomaly detection, multi-evidence hotspot ranking, urban context, Pearson/Spearman analysis, evidence explanations, and a three-zone action plan. A fully labeled Phoenix Scenario keeps the product judgeable without credentials while separating modeled heat from the public canopy sample.

## Innovation

- A traceable boundary between observed data, derived features, and model outputs.
- Spatial hotspot detection that combines heat, anomaly, persistence, neighborhood intensity, and exposure context.
- An assessment-first priority engine that explains every ranking and avoids promised outcomes.
- A deterministic KAIRO Analyst that answers judge questions through local analytical tools rather than pretending to be an LLM.
- A three-minute Presentation Mode that compresses the whole evidence-to-action story.

## Use of FortyGuard

Live Mode implements only officially verified endpoints:

1. [`POST /v1/heatmap`](https://docs-api.fortyguard.com/docs/create-heatmap) submits a validated US polygon request with the documented `api-key` header.
2. [`GET /v1/status/{activity_id}`](https://docs-api.fortyguard.com/docs/check-status) supports bounded asynchronous completion polling.

KAIRO adds input validation, safe error mapping, rate-limit-aware behavior, normalization, and strict live/demo labeling. A completed Phoenix TCM activity was verified end to end on 2026-08-27: 1,055 tiles were normalized from the live `average_temperature` field without exposing upstream properties or the server credential.

## AI and ML

- Transparent KAIRO Heat Exposure Index with centralized weights and configurable categories.
- Robust z-score anomaly detector using median absolute deviation.
- Spatial multi-signal hotspot and intervention priority ranking.
- Deterministic evidence explanations and analyst tool orchestration.

The core does not depend on an LLM.

## Data analysis

- Pearson correlation for linear association.
- Spearman correlation for monotonic association.
- Minimum matched sample of eight zones; the demo uses 30.
- Scatter plot, comparison chart, result table, variable/time/spatial filters, and methodology disclosure.
- Explicit confounders and a repeated statement that correlation does not imply causation.

## Track alignment

- **Track 01 — Resilient Cities & Infrastructure:** primary decision-support use case.
- **Track 07 — Data Analysis & Correlation:** urban-variable association pipeline.
- **Track 05 — Model Designing:** transparent exposure, anomaly, hotspot, and priority models.
- **Track 06 — Agentic AI:** future optional extension; not required by the MVP.

## Target users

Urban resilience offices, heat-response teams, planning departments, public-space designers, infrastructure teams, and climate-risk analysts.

## Impact

KAIRO improves the decision between receiving a temperature surface and commissioning the next resilience assessment. It helps teams focus review effort on zones with jointly elevated heat, persistence, anomaly, spatial, environmental, and exposure evidence.

## External dataset

Thirty real tree-canopy percentages and simplified tract-center locations from the City of Phoenix Office of Heat Response and Mitigation [Shade Study — Tree Canopy by Census Tract](https://maps.phoenix.gov/pub/rest/services/Public/Shade_Study_Data_CMO_OHR/MapServer/1). Other urban and heat values are explicitly labeled deterministic demo context.

## Three-minute demo flow

| Time | Story |
| --- | --- |
| 00:00 | Introduce KAIRO HeatShield and the temperature-to-decision problem. |
| 00:15 | Open the Phoenix 30-zone heat field. |
| 00:30 | Show the Heat Exposure score and disclaimer. |
| 00:45 | Show the three spatially ranked hotspots. |
| 01:00 | Select North Phoenix Thermal Grid. |
| 01:20 | Explain the +5.3°C local anomaly and 10-hour persistence. |
| 01:40 | Show built context and City of Phoenix canopy evidence. |
| 02:00 | Show Pearson/Spearman associations and the causality warning. |
| 02:20 | Show the top three priorities. |
| 02:40 | Open the assessment-first action plan or deterministic Analyst. |
| 03:00 | “FortyGuard provides the temperature intelligence. KAIRO turns it into decisions.” |

## Technical architecture

Next.js 16 App Router and strict TypeScript; server-only route handlers; Zod; a normalized spatial domain model; pure TypeScript intelligence modules; a responsive Canvas choropleth; Recharts; Tailwind and local shadcn-style UI primitives. Scenario state is read-only and bundled; no database is required. API keys stay server-side.

## Future development

Expand plan-specific FortyGuard fixtures, add full tract intersections and matched-time environmental data, persist observations in PostGIS, execute large jobs through queues, quantify uncertainty, test spatial autocorrelation, add multivariate controls, and provide authenticated multi-city scenario workspaces.

## Limitations

- Live FortyGuard execution is verified for the submitted Phoenix polygon; additional products and larger plan-specific areas were not exercised.
- FortyGuard documentation currently limits API coverage to the United States.
- Demo heat and most urban context variables are deterministic scenario data.
- The real 2022 canopy sample is temporally mismatched with the 2025 demo heat scenario.
- Correlations are scenario behavior, not a causal or empirical Phoenix discovery.
- The analytical index is not a certified health or safety index.

## Demo URL

[https://kairo-heatshield.vercel.app](https://kairo-heatshield.vercel.app)

The production deployment is live on Vercel with the server-only FortyGuard integration enabled and verified against the submitted Phoenix polygon.

## GitHub URL

`https://github.com/marwanyasser2005/kairo-heatshield`

# KAIRO HeatShield — submission write-up

## Problem

Urban heat decisions often stop at a map. A temperature surface can show where heat is elevated, but it does not tell a resilience team which locations deserve attention first, why they rank highly, or what evidence should be taken into the field. Limited budgets make that missing decision layer costly.

## User

KAIRO is designed for municipal resilience offices, heat-response teams, planners, public-space designers, and infrastructure teams working across U.S. cities.

## Solution

KAIRO implements **Detect → Analyze → Explain → Prioritize → Act**. It combines FortyGuard temperature intelligence with transparent analytical modules for normalization, robust anomaly detection, multi-signal hotspot ranking, association analysis, cool-route comparison, intervention screening, and field-assessment briefs.

The product has two deliberately separate evidence modes. **Live Mode** opens a completed FortyGuard Phoenix TCM activity with 1,055 normalized tiles and displays only the provider fields returned by that request. The **Phoenix Scenario** keeps the full decision workflow judgeable without spending credits. It is visibly labeled and combines deterministic scenario context with 30 real tree-canopy values from the City of Phoenix 2022 Shade Study sample.

## FortyGuard usage

FortyGuard is central to the product, not decorative. KAIRO submits `POST /v1/heatmap`, polls `GET /v1/status/{activity_id}`, validates the asynchronous response, normalizes tile geometry and `average_temperature`, and renders a responsive thermal field. The API key remains server-side. Live data is never silently replaced with demo data.

## Measurable result

KAIRO converts one verified 1,055-tile temperature activity into an inspectable operating picture, then demonstrates three ranked assessment priorities, a shortest-versus-coolest route comparison, and screening-level intervention deltas with explicit uncertainty. These are decision-support outputs, not promised real-world cooling outcomes.

## Innovation and execution

The differentiator is evidence continuity: observed values, derived features, model outputs, assumptions, and limitations remain attached from map to action. The bounded KAIRO Analyst routes questions to deterministic local tools instead of inventing measurements. The application is built with Next.js, strict TypeScript, server-only API routes, Zod, Canvas, Recharts, and tested pure analytical modules.

## Deployment path

The current Phoenix workflow can expand to other U.S. cities by replacing scenario context with matched local datasets, intersecting full-resolution geometries, persisting observations, and adding authenticated multi-city workspaces.

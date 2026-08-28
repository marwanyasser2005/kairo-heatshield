# Landing Page Override

**Page:** KAIRO HeatShield landing experience  
**Purpose:** FortyGuard Hackathon judge story and product entry point  
**Pattern:** Immersive product demo + scroll-led problem/solution narrative

## Visual direction

- Dark editorial climate-tech, not cyberpunk and not generic SaaS.
- Graphite surfaces, mineral gray text, cyan for sensing/analysis, amber-orange only for heat severity.
- A single cinematic 3D thermal digital twin above the fold; one supporting intervention render below the fold.
- HTML owns every headline and fact. Images contain no essential text.
- Use generous negative space, large direct headlines, and restrained HUD overlays tied to real product signals.

## Story order

1. Human problem and outcome: see where heat hurts; know what to investigate first.
2. Verified proof: live cells, zones, and priorities.
3. Why city averages fail.
4. Product flow: See → Explain → Prioritize → Act.
5. Intervention simulation with clear decision guardrails.
6. Three defensible differentiators and a direct product CTA.

## Copy rules

- Prefer a concrete question or outcome over “intelligence platform” language.
- Keep one idea per sentence. Avoid stacked adjectives and repeated “AI-powered,” “actionable,” or “transparent.”
- State what is live, modeled, inferred, and limited in plain language.
- Never claim guaranteed cooling, causality, health outcomes, or construction readiness.

## Motion and performance

- AVIF source assets are pre-compressed and served directly.
- One meaningful scan animation; hover depth is subtle and transform-only.
- Below-fold sections use `content-visibility`; all movement respects `prefers-reduced-motion`.
- No WebGL/Spline embed. Mobile receives the same optimized static scene without GPU overhead.

## Responsive and accessibility

- Minimum 44px interactive targets, visible focus rings, descriptive image alt text.
- No horizontal scrolling at 375px or 812×375 landscape.
- Text contrast meets WCAG AA; color is never the only status signal.

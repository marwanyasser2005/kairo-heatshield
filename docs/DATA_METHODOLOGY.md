# Data methodology

## Scope and evidence classes

KAIRO keeps three evidence classes separate throughout the UI and domain model:

1. **Observed data** — upstream or demo observations such as temperature, heat index, humidity, and persistence.
2. **Derived features** — baseline deviation, robust anomaly score, and spatial intensity.
3. **Model outputs** — KAIRO Heat Exposure score, hotspot rank, and intervention priority.

In the no-key experience, temperature values are a deterministic **PHOENIX SCENARIO**. They are not represented as measured FortyGuard values. The tree-canopy field is a real public-data sample and is attributed separately.

## FortyGuard temperature data

| Item | Method |
| --- | --- |
| Provider | FortyGuard |
| Product | Temperature API — Create Heatmap |
| Source | https://docs-api.fortyguard.com/docs/create-heatmap |
| Live spatial resolution | 60 m, 80 m, or 100 m tiles, selected in the verified request |
| Live temporal filters | Single hour, hour range, single day, or endpoint-documented day range |
| Demo temporal scenario | 2025-07-15, 08:00–22:00 Phoenix local time |
| Demo temperature values | Deterministic scenario generated for product evaluation, visibly labeled Demo |
| Verified live activity | A Phoenix TCM activity completed with 1,055 polygon tiles and 620 unique `average_temperature` values spanning 40.051–40.1879 °C. The narrow range is visualized with an explicitly relative scale. |

## External dataset used

### City of Phoenix Shade Study — Tree Canopy by Census Tract

| Field | Detail |
| --- | --- |
| Dataset | SS Tree Canopy by Census Tract |
| Provider | City of Phoenix, City Manager's Office: Office of Heat Response and Mitigation |
| Service URL | https://maps.phoenix.gov/pub/rest/services/Public/Shade_Study_Data_CMO_OHR/MapServer/1 |
| Query interface | https://maps.phoenix.gov/pub/rest/services/Public/Shade_Study_Data_CMO_OHR/MapServer/1/query |
| License | City of Phoenix Open Data Terms of Use, linked by the service item metadata: https://phoenixopendata.com/pages/terms-of-use |
| Original inputs described by provider | 2022 high-resolution canopy from Google Environmental Insights Explorer, accessed July 2023; Microsoft building footprints, accessed July 2023 |
| Variable used | `TREE_PCT_N` — tree canopy area divided by plantable ground area (total area minus building area), percent |
| Spatial resolution | U.S. Census tract aggregate |
| Temporal resolution | 2022 canopy snapshot; not a time series |
| Sample | OBJECTID 1–30 and their geometry, retrieved 2026-08-22 |
| Join | Each sampled tract's canopy value is attached to a simplified display zone centered on that tract geometry. The display square is not the official tract boundary. |
| Limitation | Object IDs are service identifiers, the 30-record sample is not a representative citywide probability sample, and source inputs carry their own provider limitations. |

The value stored as `urban.vegetationPct` comes from this layer. Built density, imperviousness, road density, and population/exposure fields remain deterministic demo context calibrated to plausible Phoenix ranges; they are never described as downloaded Census or USGS measurements.

## Supporting authoritative references

These sources informed variable choice and scale but their pixel/table values are **not** directly bundled as measurements:

- U.S. Geological Survey National Land Cover Database: https://www.usgs.gov/centers/eros/science/national-land-cover-database — documents 30 m land cover and urban imperviousness products.
- U.S. Census Bureau 2023 ACS 5-year API: https://www.census.gov/data/developers/data-sets/acs-5year/2023.html — documents small-area population and housing estimates and annotation values.

## Spatial and temporal alignment

- The Phoenix shade records are located using simplified centers calculated from the official service geometries transformed to EPSG:4326.
- Demo heat polygons are small visualization buffers around those centers. This preserves a reproducible geographic join without misrepresenting simplified shapes as official census boundaries.
- The 2022 canopy snapshot and July 2025 demo heat scenario are not contemporaneous. Canopy is treated as relatively slow-changing urban context, and this mismatch is disclosed rather than hidden.
- A production live analysis should intersect FortyGuard tiles with full-resolution tract polygons and attach area-weighted canopy values.

## Normalization

KAIRO clamps each Heat Exposure component to a documented analytical range before weighting:

| Component | Range | Weight |
| --- | ---: | ---: |
| Temperature | 30–48 °C | 0.30 |
| Persistence | 0–12 h | 0.22 |
| Heat-index uplift | 0–10 °C | 0.15 |
| Temporal deviation | -2–8 °C | 0.18 |
| Spatial intensity | 0–1 | 0.15 |

The weights sum to 1.00 and are centralized in `lib/intelligence/risk.ts`. The score supports hackathon decision triage only and is not a certified safety or public-health index.

## Anomaly detection

For each zone, KAIRO calculates:

- baseline = median of the historical comparison window;
- median absolute deviation (MAD);
- robust z-score = `0.6745 × (current − median) / MAD`;
- standard z-score fallback only if MAD is zero and standard deviation is non-zero.

At least five historical observations are required. Severity thresholds use absolute score: LOW < 1.5, MODERATE < 2.5, HIGH < 3.5, and CRITICAL ≥ 3.5. A high score says the value is unusual relative to its supplied baseline; it does not explain why.

## Hotspot ranking

`detectHotspots()` is spatially aware. It calculates a neighborhood temperature intensity within an approximately 0.027-degree local radius, then combines:

- Heat Exposure score — 35%
- anomaly evidence — 20%
- persistence — 15%
- neighborhood intensity — 15%
- population-density exposure context — 15%

This prevents the hotspot list from being a temperature-only sort. Population is an exposure context, not an estimate of illness or health impact.

## Priority ranking

The three highest hotspot scores become Priority 1–3. Recommendations use cautious assessment language and select among vegetation/shade, cool-surface/public-space, cooling infrastructure, and monitoring assessments based on urban context. KAIRO does not estimate guaranteed temperature reduction.

## Correlation

- **Pearson r** measures linear association.
- **Spearman ρ** is Pearson correlation over average ranks and measures monotonic association.
- At least eight matched zones are required.
- The UI reports coefficient, sample size, direction, strength, and both methods.
- No p-value or confidence interval is shown for this small deterministic demo because inferential significance would be misleading.

The sample can demonstrate how real vegetation context participates in an analytical workflow, but the demo temperature field was intentionally generated from urban variables. Therefore the displayed correlations are **scenario behavior, not an empirical discovery about Phoenix**.

## Confounders and causality limitations

Correlation does not imply causation. Potential confounders include season, time of day, humidity, elevation, synoptic weather, land use, urban morphology, sensor/model uncertainty, and the temporal mismatch between canopy and temperature. A production study should use multiple matched days, stratify by hour/season, control for weather and elevation, test spatial autocorrelation, and report uncertainty before drawing explanatory conclusions.

# FortyGuard API research record

Checked: **2026-08-22**. Only official FortyGuard sources were used. Technical implementation follows the current API documentation when marketing or pricing copy differs.

## Verified platform facts

- Base URL: `https://api.fortyguard.com`.
- Authentication: API key in the `api-key` request header. No OAuth exchange is required.
- Current regional coverage: United States only for Basic, Premium, and Startup plans.
- Activity model: analysis submissions return `data.activity_id`; clients retrieve results with `GET /v1/status/{activity_id}`.
- Terminal states documented by the quickstart: `Completed` and `Failed`; `Processing` is non-terminal. Polling must be bounded.
- Documented HTTP handling: `400/422` invalid request, `401` invalid/missing key, `403` plan/authorization restriction, `404` activity not found or temporarily unavailable, `429` rate limited, and `500` server processing error.
- Credits are charged only after successful completion. A numeric request-per-minute rate limit was not published in the retrieved official material, so the client does not invent one.

## Implemented endpoints

### Submit heatmap

| Field | Verified value |
| --- | --- |
| Source URL | https://docs-api.fortyguard.com/docs/create-heatmap |
| Source title | Create Heatmap POST |
| Endpoint | `POST https://api.fortyguard.com/v1/heatmap` |
| Authentication | `api-key` header |
| Required request | `polygon_aoi` GeoJSON FeatureCollection containing a closed Polygon; `date_time.start_date`; `date_time.filter_type`; `granularity` |
| Supported filter types | `1` single hour, `2` same-day hour range, `3` single day, and the endpoint page documents `4` range of days up to one month |
| Granularity | `60`, `80`, or `100` metres |
| Optional verified fields | `date_time.end_date`, `start_time`, `end_time`, `analytic_type`, `threshold`, `direction` |
| Analytics | `tcm`, `time_of_measure`, `exceedance`, `persistence` |
| Submission response | JSON with `data.activity_id` |
| Completed result | `data.result.map_data` GeoJSON FeatureCollection and `data.result.stats_data` |
| Plans | Basic (up to 10 mi²), Premium (up to 50 mi²); official limitations also list Startup at up to 10 mi² |
| Coverage | United States only |
| Date range | 2019-01-01 through now; heatmap endpoint supports up to 12 hours forecast |
| Implementation notes | Request is Zod-validated; live response is normalized; raw upstream payload is not passed to the UI |

The general limitations page lists filter types 1–3 while the current heatmap endpoint page also documents filter type 4. The implementation accepts type 4 only for heatmap requests and requires `end_date`, following the endpoint-specific page.

### Check activity status

| Field | Verified value |
| --- | --- |
| Source URL | https://docs-api.fortyguard.com/docs/check-status |
| Supporting source | https://docs-api.fortyguard.com/docs/quickstart |
| Source title | Check Status GET / Quickstart |
| Endpoint | `GET https://api.fortyguard.com/v1/status/{activity_id}` |
| Authentication | `api-key` header |
| Request | UUID-like activity ID in path; no request body |
| Processing response | JSON with `data.activity_id` and `data.status: "Processing"` |
| Completed response | Same envelope with endpoint-specific `data.result` |
| Polling | Controlled interval, finite attempts; stop on `Completed`, `Succeeded`, `Failed`, or `Error` |
| Plans | Basic and Premium |
| Coverage | Inherits the submitted endpoint's United States-only coverage |
| Implementation notes | A short-lived `404` immediately after submission is documented and treated as retryable by the bounded server poller |

## Verified but not submitted by this product

These are shown in capability reporting, but KAIRO does not create live requests for them in this release.

| Capability | Official source | Endpoint | Plan | Verified notes |
| --- | --- | --- | --- | --- |
| Environmental Parameters | https://docs-api.fortyguard.com/docs/environmental-parameters | `POST /v1/env_params` | Basic: up to 3 selected parameters; Premium: full access | Required latitude, longitude, temperature, and date_time; async result includes metadata, locations, parameter arrays, and solar irradiance. Not submitted to avoid consuming extra credits during the judge flow. |
| Satellite Segmentation | https://docs-api.fortyguard.com/docs/satellite-view-segmentation | `POST /v1/satellite` | Premium | Coordinate/date/granularity request; async Base64 imagery and segmentation output. |
| Street View Segmentation | https://docs-api.fortyguard.com/docs/street-view-segmentation | `POST /v1/streetview` | Premium | Coordinate and camera-angle request; async front/back segmentation output. |
| Heat Intelligence | https://docs-api.fortyguard.com/docs/heat-intelligence | `POST /v1/heat_intelligence` | Premium | Geographic, environmental, urban, events, and anthropogenic categories; completed result uses a temporary PDF download link. |

## Capability and plan behavior

| Capability | Basic | Premium | Startup | KAIRO behavior |
| --- | --- | --- | --- | --- |
| Heatmap + map statistics | Up to 10 mi² | Up to 50 mi² | Up to 10 mi² | Live when a server key exists; Demo otherwise |
| Environmental parameters | Up to 3 | Full | Up to 3 | Capability displayed; Demo environmental layer used in the core judge flow |
| Satellite segmentation | Unavailable | Available | Unavailable | Shown as plan-restricted unless a Premium plan is known; no fabricated request |
| Street View segmentation | Unavailable | Available | Unavailable | Shown as plan-restricted unless a Premium plan is known; no fabricated request |
| Heat Intelligence reports | Unavailable | Available | Unavailable | Shown as plan-restricted; KAIRO's deterministic engine remains independent |

The API does not expose a documented public “capabilities” discovery endpoint. `getFortyGuardCapabilities()` therefore reports configuration and documented plan requirements, not a fabricated upstream probe. Without a key it returns `unavailable`; with a key but no known plan it returns heatmap/status as available and premium-only features as `plan-restricted/unknown`.

## Sources consulted

| Official source | What was verified |
| --- | --- |
| https://docs-api.fortyguard.com/ | Product capability overview and plan labels |
| https://docs-api.fortyguard.com/docs/authentication | `api-key` header authentication |
| https://docs-api.fortyguard.com/docs/quickstart | Submission envelope, status polling, HTTP/status handling, credit timing |
| https://docs-api.fortyguard.com/docs/create-heatmap | Heatmap request, analytics, response, area limits |
| https://docs-api.fortyguard.com/docs/check-status | Unified activity-status endpoint and processing response |
| https://docs-api.fortyguard.com/docs/environmental-parameters | Environmental request/result shape and plan limits |
| https://docs-api.fortyguard.com/docs/satellite-view-segmentation | Satellite request/result shape and Premium restriction |
| https://docs-api.fortyguard.com/docs/street-view-segmentation | Street-view request/result shape and Premium restriction |
| https://docs-api.fortyguard.com/docs/heat-intelligence | Report request, async flow, temporary download link, Premium restriction |
| https://docs-api.fortyguard.com/docs/limitations | US-only coverage, input constraints, plans, credits, processing behavior |
| https://docs-api.fortyguard.com/docs/release-notes | v1 endpoint inventory and current GA surface |
| https://www.fortyguard.com/api-pricing | Public Basic/Pro prices, credit allocations, marketing feature comparison |
| https://www.fortyguard.com/hackathon26 | Official hackathon page; the retrieved public page contained the event shell but no additional technical schema |

## Limitations and discrepancies

- The pricing page calls the higher tier “Pro”; API documentation calls it “API Premium.” Code and technical docs use **Premium**.
- The status documentation previously included conflicting copy about streaming Heat Intelligence PDFs, while the current Heat Intelligence page says status returns JSON containing a temporary `download_link`. KAIRO does not implement the report endpoint, avoiding an unverified content-type assumption.
- A real Phoenix heatmap activity completed during verification and returned 1,055 polygon tiles. Plan metadata is still not inferred, and the UI is labeled LIVE only after a successful normalized upstream result.
- The API's exact heatmap feature property names are not enumerated in the official result schema. The normalizer accepts only numeric temperature-like properties it can identify and otherwise returns a safe normalization error instead of inventing fields.

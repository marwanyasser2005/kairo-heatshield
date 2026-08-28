# FortyGuard API integration

Checked against official FortyGuard documentation and a completed live activity on **2026-08-27**. KAIRO implements only the two upstream endpoints below. Raw upstream payloads are never sent directly to UI components.

## 1. Create heatmap

| Item | Verified implementation |
| --- | --- |
| Purpose | Submit a hyperlocal temperature heatmap activity for a validated GeoJSON polygon. |
| Official source | [Create Heatmap POST](https://docs-api.fortyguard.com/docs/create-heatmap) and [Quickstart](https://docs-api.fortyguard.com/docs/quickstart) |
| Upstream URL | `https://api.fortyguard.com/v1/heatmap` |
| Method | `POST` |
| Authentication | Server-only `api-key` header containing `FORTYGUARD_API_KEY`. |
| Request | `polygon_aoi` FeatureCollection with closed Polygon rings; `date_time.start_date`; documented filter fields; granularity `60`, `80`, or `100`; optional documented analytic type, threshold, and direction. |
| Response | Submission envelope containing `data.activity_id`; the completed activity contains `data.result.map_data` GeoJSON and `stats_data`. |
| Polling | The route submits once and returns `202` with an activity ID. The browser then calls the same-origin status route on a bounded schedule of 0, 1.5, 2.5, 4, 6, 8, 10, and 12 seconds. It stops on completion, failure, or timeout. |
| Errors | Maps `400/422`, `401`, `403`, `404`, `429`, timeout, and upstream failure to safe internal errors. A short-lived status `404` is retried only during the first two attempts. |
| Plan | Basic up to 10 mi²; Premium up to 50 mi². Startup is documented as up to 10 mi² on the limitations page. |
| Coverage | United States only. |
| KAIRO route | `POST /api/fortyguard/heatmap` |
| Files | `app/api/fortyguard/heatmap/route.ts`, `lib/fortyguard/client.ts`, `lib/fortyguard/schemas.ts`, `lib/fortyguard/heatmap.ts`, `lib/fortyguard/status.ts` |

The public KAIRO request route rejects bodies over 64 KiB, validates with Zod, submits the activity, and returns `Cache-Control: no-store`. The separate status route normalizes completed GeoJSON into KAIRO zone types. A live Phoenix verification returned 1,055 polygon tiles with `average_temperature`, `min_temperature`, and `max_temperature`; KAIRO uses the verified average field and never forwards these raw properties. If a tile has no identifiable numeric temperature property, normalization fails safely instead of guessing.

## 2. Check activity status

| Item | Verified implementation |
| --- | --- |
| Purpose | Retrieve the state and endpoint-specific result of an asynchronous activity. |
| Official source | [Check Status GET](https://docs-api.fortyguard.com/docs/check-status) and [Quickstart](https://docs-api.fortyguard.com/docs/quickstart) |
| Upstream URL | `https://api.fortyguard.com/v1/status/{activity_id}` |
| Method | `GET` |
| Authentication | Server-only `api-key` header. |
| Request | Activity ID in the URL path; no body. KAIRO restricts it to 1–200 alphanumeric/hyphen characters before forwarding. |
| Response | Envelope containing `data.activity_id`, `data.status`, and optional endpoint-specific `data.result`. |
| Polling | Each call performs exactly one upstream lookup. The browser owns the bounded schedule above, avoiding a long-held serverless request. |
| Errors | Safe handling for authentication, plan restriction, temporary/not-found activity, rate limit, timeout, malformed envelope, and upstream failure. |
| Plan | Basic and Premium. |
| Coverage | Inherits the submitted endpoint's United States-only coverage. |
| KAIRO route | `GET /api/fortyguard/status/{activityId}` |
| Files | `app/api/fortyguard/status/[activityId]/route.ts`, `lib/fortyguard/status.ts`, `lib/fortyguard/client.ts` |

## Local capability report

`GET /api/fortyguard/capabilities` is a KAIRO route, not a claimed FortyGuard endpoint. Official documentation exposes no public capability-discovery endpoint, so `getFortyGuardCapabilities()` reports server configuration and documented plan restrictions only.

- With no key, Live heatmap/status are unavailable and the Phoenix Scenario remains active.
- With a key, heatmap/status are shown as configured but only a successful request proves current availability.
- Environmental Parameters, Satellite Segmentation, Street View Segmentation, and Heat Intelligence are described as verified capabilities with plan notes, but this release does not submit those endpoints.

## Live-mode trust boundary

The browser never receives the API key. It calls KAIRO's same-origin route; the server validates input, restricts the public runner to the reviewed Phoenix AOI, adds a best-effort cooldown, adds the key, bounds network time, validates the upstream envelope, and emits a normalized response. The UI displays `LIVE FORTYGUARD DATA` only after a completed normalized activity. On failure it shows the error and keeps the Phoenix Scenario explicit—there is no silent live-to-scenario substitution.

## Environment

```env
FORTYGUARD_API_KEY=
FORTYGUARD_BASE_URL=
```

`FORTYGUARD_BASE_URL` is optional and defaults to the verified `https://api.fortyguard.com`. Neither variable may use a `NEXT_PUBLIC_` prefix.

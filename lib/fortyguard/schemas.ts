import { z } from "zod";

const coordinateSchema = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]);
const ringSchema = z.array(coordinateSchema).min(4).superRefine((ring, context) => {
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    context.addIssue({ code: "custom", message: "Polygon rings must be closed." });
  }
});

export const polygonAoiSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(
    z.object({
      type: z.literal("Feature"),
      properties: z.record(z.string(), z.unknown()).default({}),
      geometry: z.object({ type: z.literal("Polygon"), coordinates: z.array(ringSchema).min(1) }),
    }),
  ).min(1).max(10),
});

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.");
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM in 24-hour time.");

export const heatmapRequestSchema = z.object({
  polygon_aoi: polygonAoiSchema,
  date_time: z.object({
    start_date: dateSchema,
    end_date: dateSchema.optional(),
    start_time: timeSchema.optional(),
    end_time: timeSchema.optional(),
    filter_type: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  }),
  granularity: z.union([z.literal(60), z.literal(80), z.literal(100)]),
  analytic_type: z.enum(["tcm", "time_of_measure", "exceedance", "persistence"]).optional(),
  threshold: z.number().min(-80).max(80).optional(),
  direction: z.enum(["above", "below"]).optional(),
}).superRefine((request, context) => {
  const filter = request.date_time.filter_type;
  if ((filter === 1 || filter === 2) && !request.date_time.start_time) {
    context.addIssue({ code: "custom", path: ["date_time", "start_time"], message: "start_time is required for filter type 1 or 2." });
  }
  if (filter === 2 && !request.date_time.end_time) {
    context.addIssue({ code: "custom", path: ["date_time", "end_time"], message: "end_time is required for filter type 2." });
  }
  if (filter === 4 && !request.date_time.end_date) {
    context.addIssue({ code: "custom", path: ["date_time", "end_date"], message: "end_date is required for filter type 4." });
  }
  if (["exceedance", "persistence"].includes(request.analytic_type ?? "") && request.threshold === undefined) {
    context.addIssue({ code: "custom", path: ["threshold"], message: "A temperature threshold is required for exceedance or persistence." });
  }
});

export const submissionEnvelopeSchema = z.object({
  error: z.boolean(),
  status_code: z.number(),
  message: z.string(),
  data: z.object({ activity_id: z.string().min(1).max(200) }),
});

export const statusEnvelopeSchema = z.object({
  error: z.boolean(),
  status_code: z.number(),
  message: z.string(),
  data: z.object({
    activity_id: z.string(),
    status: z.string(),
    result: z.unknown().optional(),
  }),
});

export type HeatmapRequest = z.infer<typeof heatmapRequestSchema>;

export const PHOENIX_ANALYSIS_TIMESTAMP = "2025-07-15T16:00:00-07:00";

export const PHOENIX_LIVE_REQUEST: HeatmapRequest = {
  polygon_aoi: {
    type: "FeatureCollection",
    features: [{
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [[[-112.092, 33.442], [-112.052, 33.442], [-112.052, 33.47], [-112.092, 33.47], [-112.092, 33.442]]],
      },
    }],
  },
  date_time: { start_date: "2025-07-15", start_time: "16:00", filter_type: 1 },
  granularity: 100,
  analytic_type: "tcm",
};

export function isApprovedPhoenixRequest(request: HeatmapRequest) {
  return JSON.stringify(request) === JSON.stringify(PHOENIX_LIVE_REQUEST);
}

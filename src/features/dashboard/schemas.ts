import { z } from "zod";

export const PRESETS = ["last-90-days", "this-month", "ytd"] as const;

export type Period = (typeof PRESETS)[number];

export const periodSchema = z.enum(PRESETS);

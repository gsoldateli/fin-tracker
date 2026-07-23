import { z } from "zod";

export { format, parse, subDays, addDays } from "date-fns";

export function getTodayCivilDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getYesterdayCivilDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatCivilDate(s: string): string {
  const [, month, day] = s.split("-");
  return `${MONTHS_SHORT[parseInt(month, 10) - 1]} ${parseInt(day, 10)}`;
}

export function isValidCivilDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export const civilDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format");

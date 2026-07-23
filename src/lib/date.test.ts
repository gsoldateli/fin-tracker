import { describe, it, expect, vi } from "vitest";
import { getTodayCivilDate, getYesterdayCivilDate } from "./date";

describe("getTodayCivilDate", () => {
  it("returns YYYY-MM-DD for today", () => {
    const result = getTodayCivilDate();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("getYesterdayCivilDate", () => {
  it("returns the previous day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T12:00:00"));
    expect(getYesterdayCivilDate()).toBe("2026-07-14");
    vi.useRealTimers();
  });

  it("rolls back from day 1 to last day of previous month", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T12:00:00"));
    expect(getYesterdayCivilDate()).toBe("2026-06-30");
    vi.useRealTimers();
  });

  it("rolls back from January 1st to December 31st of previous year", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00"));
    expect(getYesterdayCivilDate()).toBe("2025-12-31");
    vi.useRealTimers();
  });

  it("handles leap year February 29 → March 1", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-03-01T12:00:00"));
    expect(getYesterdayCivilDate()).toBe("2024-02-29");
    vi.useRealTimers();
  });
});

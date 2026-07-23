import { describe, it, expect } from "vitest";
import { parseCents, formatCents, pushDigit, popDigit } from "./money";

describe("parseCents", () => {
  it('parses "19.90" to 1990', () => {
    expect(parseCents("19.90")).toBe(1990);
  });
  it('parses "1,234.56" to 123456', () => {
    expect(parseCents("1,234.56")).toBe(123456);
  });
  it('parses "-50" to -5000', () => {
    expect(parseCents("-50")).toBe(-5000);
  });
  it('parses "abc" to null', () => {
    expect(parseCents("abc")).toBeNull();
  });
  it('parses empty string to null', () => {
    expect(parseCents("")).toBeNull();
  });
  it('parses whitespace-only string to null', () => {
    expect(parseCents("   ")).toBeNull();
  });
  it('parses "19.9" (one decimal digit) to 1990', () => {
    expect(parseCents("19.9")).toBe(1990);
  });
  it('rejects more than 2 decimal places', () => {
    expect(parseCents("19.999")).toBeNull();
  });
  it("rejects multiple dots", () => {
    expect(parseCents("19.90.00")).toBeNull();
  });
  it('parses "-1,234.56" to -123456', () => {
    expect(parseCents("-1,234.56")).toBe(-123456);
  });
  it('parses "0.01" to 1', () => {
    expect(parseCents("0.01")).toBe(1);
  });
  it('parses "0.00" to 0', () => {
    expect(parseCents("0.00")).toBe(0);
  });
  it('parses "1,234" (no decimal) to 123400', () => {
    expect(parseCents("1,234")).toBe(123400);
  });
  it('parses "1234" (no separator) to 123400', () => {
    expect(parseCents("1234")).toBe(123400);
  });
  it('parses "-0.50" to -50', () => {
    expect(parseCents("-0.50")).toBe(-50);
  });
  it("rejects non-numeric integer part", () => {
    expect(parseCents("abc.50")).toBeNull();
  });
  it("rejects non-numeric decimal part", () => {
    expect(parseCents("10.ab")).toBeNull();
  });
  it('parses with leading/trailing whitespace', () => {
    expect(parseCents("  19.90  ")).toBe(1990);
  });
});

describe("pushDigit", () => {
  it("pushes digits right-to-left from zero", () => {
    expect(pushDigit(0, 1)).toBe(1);
  });
  it("accumulates: 1→12→123→1234→12345→123456", () => {
    let v = 0;
    v = pushDigit(v, 1); expect(v).toBe(1);
    v = pushDigit(v, 2); expect(v).toBe(12);
    v = pushDigit(v, 3); expect(v).toBe(123);
    v = pushDigit(v, 4); expect(v).toBe(1234);
    v = pushDigit(v, 5); expect(v).toBe(12345);
    v = pushDigit(v, 6); expect(v).toBe(123456);
  });
  it("preserves negative sign", () => {
    expect(pushDigit(-5, 0)).toBe(-50);
  });
  it("pushes zero digit on negative", () => {
    expect(pushDigit(-50, 0)).toBe(-500);
  });
  it("pushes zero digit on zero stays zero", () => {
    expect(pushDigit(0, 0)).toBe(0);
  });
  it("handles large numbers without overflow", () => {
    expect(pushDigit(99999999, 1)).toBe(999999991);
  });
});

describe("popDigit", () => {
  it("removes last digit: 123456→12345→1234→123→12→1→0", () => {
    let v = 123456;
    v = popDigit(v); expect(v).toBe(12345);
    v = popDigit(v); expect(v).toBe(1234);
    v = popDigit(v); expect(v).toBe(123);
    v = popDigit(v); expect(v).toBe(12);
    v = popDigit(v); expect(v).toBe(1);
    v = popDigit(v); expect(v).toBe(0);
  });
  it("popDigit on zero stays zero", () => {
    expect(popDigit(0)).toBe(0);
  });
  it("preserves negative sign", () => {
    expect(popDigit(-1234)).toBe(-123);
  });
  it("popDigit single digit to zero", () => {
    expect(popDigit(5)).toBe(0);
  });
  it("popDigit until sign flips to zero", () => {
    expect(popDigit(-1)).toBe(-0);
  });
});

describe("formatCents", () => {
  it('formats 1990 to "$19.90"', () => {
    expect(formatCents(1990)).toBe("$19.90");
  });
  it('formats -5000 to "-$50.00"', () => {
    expect(formatCents(-5000)).toBe("-$50.00");
  });
  it('formats 0 to "$0.00"', () => {
    expect(formatCents(0)).toBe("$0.00");
  });
  it('formats 123456 to "$1,234.56"', () => {
    expect(formatCents(123456)).toBe("$1,234.56");
  });
  it('formats -1 to "-$0.01"', () => {
    expect(formatCents(-1)).toBe("-$0.01");
  });
  it('formats 100 to "$1.00"', () => {
    expect(formatCents(100)).toBe("$1.00");
  });
  it('formats -100 to "-$1.00"', () => {
    expect(formatCents(-100)).toBe("-$1.00");
  });
  it('formats 100000 to "$1,000.00"', () => {
    expect(formatCents(100000)).toBe("$1,000.00");
  });
  it('formats 5 to "$0.05" (single-digit cent)', () => {
    expect(formatCents(5)).toBe("$0.05");
  });
  it('formats 1234567 to "$12,345.67"', () => {
    expect(formatCents(1234567)).toBe("$12,345.67");
  });
});

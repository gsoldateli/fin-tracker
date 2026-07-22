import { z } from "zod";

export const moneyCentsSchema = z.number().int("Value must be in whole cents");
export const positiveMoneyCentsSchema = moneyCentsSchema.positive("Value must be greater than zero");

export function parseCents(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const negative = trimmed.startsWith("-");
  const clean = negative ? trimmed.slice(1) : trimmed;

  const parts = clean.split(".");
  if (parts.length > 2) return null;

  const integerPart = parts[0].replace(/,/g, "");
  if (!/^\d+$/.test(integerPart)) return null;

  let cents: number;
  if (parts.length === 2) {
    const decimalPart = parts[1];
    if (decimalPart.length > 2) return null;
    if (!/^\d+$/.test(decimalPart)) return null;
    cents = parseInt(integerPart, 10) * 100 + parseInt(decimalPart.padEnd(2, "0"), 10);
  } else {
    cents = parseInt(integerPart, 10) * 100;
  }

  return negative ? -cents : cents;
}

export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export function pushDigit(cents: number, digit: number): number {
  const abs = Math.abs(cents);
  const newValue = abs * 10 + digit;
  return cents < 0 ? -newValue : newValue;
}

export function popDigit(cents: number): number {
  const abs = Math.abs(cents);
  const newValue = Math.abs(Math.floor(abs / 10));
  return cents < 0 ? -newValue : newValue;
}

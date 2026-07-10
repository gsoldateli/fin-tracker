import { z } from "zod";

export const moneyCentsSchema = z.number().int("Valor deve ser em centavos inteiros");
export const positiveMoneyCentsSchema = moneyCentsSchema.positive("Valor deve ser maior que zero");

export function parseRealToCents(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const negative = trimmed.startsWith("-");
  const clean = negative ? trimmed.slice(1) : trimmed;

  const parts = clean.split(",");
  if (parts.length > 2) return null;

  const integerPart = parts[0].replace(/\./g, "");
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

export function formatCentsToReal(cents: number): string {
  const abs = Math.abs(cents);
  const integerPart = Math.floor(abs / 100);
  const decimalPart = abs % 100;

  const formattedInteger = integerPart.toLocaleString("pt-BR", { useGrouping: true });

  const result = `${formattedInteger},${String(decimalPart).padStart(2, "0")}`;
  return cents < 0 ? `-${result}` : result;
}

export function pushDigit(cents: number, digit: number): number {
  const abs = Math.abs(cents);
  const newValue = abs * 10 + digit;
  return cents < 0 ? -newValue : newValue;
}

export function popDigit(cents: number): number {
  const abs = Math.abs(cents);
  const newValue = Math.floor(abs / 10);
  return cents < 0 ? -newValue : newValue;
}

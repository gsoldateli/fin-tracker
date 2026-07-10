export function parseRealToCents(input: string): number | null {
    const normalized = input.trim().replace(/\./g, "").replace(",", ".");
    if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) return null;
    const [intPart, decPart = ""] = normalized.split(".");
    const cents = parseInt(intPart, 10) * 100
        + Math.sign(parseInt(intPart, 10) || 1) * parseInt(decPart.padEnd(2, "0"), 10);
    return cents;
}
export function parseAmount(v: string): number {
  const normalised = v.replaceAll(",", ".").trim();
  const n = +normalised;
  
  return Number.isFinite(n) ? n : NaN;
}

export function formatCurrency(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

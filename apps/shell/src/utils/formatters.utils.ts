/** Money in minor units (pence, cents) as the tenant's locale writes it. */
export function formatMoney(amountMinor: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {style: 'currency', currency}).format(amountMinor / 100);
}

/** An ISO date (2026-09-26) as the tenant's locale writes it. */
export function formatDate(isoDate: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {dateStyle: 'medium', timeZone: 'UTC'}).format(
    new Date(`${isoDate}T00:00:00Z`)
  );
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

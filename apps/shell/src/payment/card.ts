/** Card checks shared by the payment form and the mock API. */

export function normaliseCardNumber(value: string): string {
  return value.replace(/[\s-]/g, '');
}

/** 12 to 19 digits that pass the Luhn checksum. */
export function isCardNumber(value: string): boolean {
  const digits = normaliseCardNumber(value);
  if (!/^\d{12,19}$/.test(digits)) {
    return false;
  }
  let sum = 0;
  for (let index = 0; index < digits.length; index++) {
    let digit = Number(digits[digits.length - 1 - index]);
    if (index % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

/** MM/YY, this month or later. */
export function isExpiry(value: string, today = new Date()): boolean {
  const match = /^(\d{2})\s*\/\s*(\d{2})$/.exec(value.trim());
  if (!match) {
    return false;
  }
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) {
    return false;
  }
  return year > today.getFullYear() || (year === today.getFullYear() && month >= today.getMonth() + 1);
}

export function isCvc(value: string): boolean {
  return /^\d{3,4}$/.test(value.trim());
}

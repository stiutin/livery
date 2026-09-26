/** What the mock API speaks. Money is in minor units (cents, pence); the tenant's settings say which currency. */

export interface Session {
  readonly token: string;
  readonly name: string;
  readonly email: string;
}

export interface Account {
  readonly name: string;
  readonly email: string;
  /** A plan code (essential, plus, business); the page names it in its language. */
  readonly plan: 'essential' | 'plus' | 'business';
  readonly memberSince: string;
}

export type InvoiceStatus = 'open' | 'overdue' | 'paid';

export interface Invoice {
  readonly id: string;
  readonly number: string;
  readonly issuedOn: string;
  readonly dueOn: string;
  readonly amountMinor: number;
  readonly status: InvoiceStatus;
}

export interface Card {
  readonly number: string;
  readonly expiry: string;
  readonly cvc: string;
}

/** A payment either goes through, or the bank asks the customer to confirm it first (3-D Secure). */
export type PaymentOutcome =
  | {readonly status: 'succeeded'; readonly invoice: Invoice}
  | {readonly status: 'requires_action'; readonly paymentId: string};

/** What went wrong, as a code the page turns into a message in its own language. */
export const API_ERROR_CODES = [
  'invalid_credentials',
  'session_expired',
  'card_declined',
  'invalid_card',
  'already_paid',
  'payment_expired',
  'payment_not_confirmed',
  'not_found',
  'unknown',
] as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: ApiErrorCode;

  constructor(status: number, code: ApiErrorCode) {
    super(`${status} ${code}`);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/** What the mock API speaks. Money is in minor units (cents, pence); the tenant's settings say which currency. */

export interface Session {
  readonly token: string;
  readonly name: string;
  readonly email: string;
}

export interface Account {
  readonly name: string;
  readonly email: string;
  readonly plan: string;
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

/** An API error with the message the page can show. */
export class ApiError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

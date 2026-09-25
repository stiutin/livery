export type BillingState =
  | {status: 'idle'}
  | {status: 'loading'}
  | {status: 'error'; message: string}
  | {status: 'empty'; message: string}
  | {status: 'success'; result: {invoiceId: string; amount: number}};

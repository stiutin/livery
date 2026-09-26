import {delay, http, HttpResponse} from 'msw';
import {tenants} from 'virtual:livery/tenants';

import type {Card, PaymentOutcome, Session} from '../api/types';
import {isCardNumber, isCvc, isExpiry, normaliseCardNumber} from '../payment/card';
import {customer, markPaid, startPayment, takePayment} from './db';

/** Test cards, as payment providers publish them: one always declines, one always asks the bank to confirm. */
export const TEST_CARDS = {
  success: '4242 4242 4242 4242',
  declined: '4000 0000 0000 0002',
  confirm: '4000 0027 6000 3184',
} as const;

/** The one password the mock API refuses, to show a failed sign-in. */
export const WRONG_PASSWORD = 'wrong-password';

const API = '*/api/:tenant';
const LATENCY = 400;

const error = (status: number, message: string) => HttpResponse.json({message}, {status});

/** The signed-in customer from the bearer token, or undefined. Tokens are plain JSON: this is a mock. */
function who(request: Request, tenant: string): string | undefined {
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '');
  try {
    const parsed: unknown = token ? JSON.parse(atob(token)) : undefined;
    if (typeof parsed === 'object' && parsed !== null) {
      const {tenant: owner, email} = parsed as {tenant?: unknown; email?: unknown};
      return owner === tenant && typeof email === 'string' ? email : undefined;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

const knownTenant = (tenant: unknown): tenant is string => tenants.some((candidate) => candidate.id === tenant);

export const handlers = [
  http.post<{tenant: string}>(`${API}/session`, async ({request, params}) => {
    await delay(LATENCY);
    if (!knownTenant(params.tenant)) {
      return error(404, 'Unknown tenant.');
    }
    const {email, password} = (await request.json()) as {email?: string; password?: string};
    if (!email || !password || password === WRONG_PASSWORD) {
      return error(401, 'The email or password is not right.');
    }
    const {account} = customer(params.tenant, email);
    const session: Session = {token: btoa(JSON.stringify({tenant: params.tenant, email})), name: account.name, email};
    return HttpResponse.json(session);
  }),

  http.get<{tenant: string}>(`${API}/account`, async ({request, params}) => {
    await delay(LATENCY);
    const email = who(request, params.tenant);
    return email ? HttpResponse.json(customer(params.tenant, email).account) : error(401, 'Please sign in again.');
  }),

  http.get<{tenant: string}>(`${API}/invoices`, async ({request, params}) => {
    await delay(LATENCY);
    const email = who(request, params.tenant);
    return email ? HttpResponse.json(customer(params.tenant, email).invoices) : error(401, 'Please sign in again.');
  }),

  http.post<{tenant: string; invoiceId: string}>(`${API}/invoices/:invoiceId/payments`, async ({request, params}) => {
    await delay(LATENCY * 2);
    const email = who(request, params.tenant);
    if (!email) {
      return error(401, 'Please sign in again.');
    }
    const invoice = customer(params.tenant, email).invoices.find(({id}) => id === params.invoiceId);
    if (!invoice || invoice.status === 'paid') {
      return error(409, 'This invoice is already paid.');
    }
    const card = (await request.json()) as Partial<Card>;
    const number = normaliseCardNumber(card.number ?? '');
    if (!isCardNumber(number) || !isExpiry(card.expiry ?? '') || !isCvc(card.cvc ?? '')) {
      return error(400, 'Check the card details.');
    }
    if (number === normaliseCardNumber(TEST_CARDS.declined)) {
      return error(402, 'Your card was declined. Try another card.');
    }
    if (number === normaliseCardNumber(TEST_CARDS.confirm)) {
      const outcome: PaymentOutcome = {
        status: 'requires_action',
        paymentId: startPayment({tenant: params.tenant, email, invoiceId: invoice.id}),
      };
      return HttpResponse.json(outcome);
    }
    const paid = markPaid(params.tenant, email, invoice.id);
    return paid
      ? HttpResponse.json({status: 'succeeded', invoice: paid} satisfies PaymentOutcome)
      : error(404, 'No such invoice.');
  }),

  http.post<{tenant: string; paymentId: string}>(`${API}/payments/:paymentId/confirm`, async ({request, params}) => {
    await delay(LATENCY);
    const email = who(request, params.tenant);
    const payment = takePayment(params.paymentId);
    if (!email || payment?.email !== email) {
      return error(404, 'This payment has expired. Start again.');
    }
    const {approved} = (await request.json()) as {approved?: boolean};
    if (!approved) {
      return error(402, 'You did not confirm the payment, so nothing was charged.');
    }
    const paid = markPaid(params.tenant, email, payment.invoiceId);
    return paid
      ? HttpResponse.json({status: 'succeeded', invoice: paid} satisfies PaymentOutcome)
      : error(404, 'No such invoice.');
  }),
];

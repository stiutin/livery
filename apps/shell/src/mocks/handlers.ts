import {delay, http, HttpResponse} from 'msw';
import {tenants} from 'virtual:livery/tenants';

import type {ApiErrorCode, Card, PaymentOutcome, Session} from '../api/types';
import {isCardNumber, isCvc, isExpiry, normaliseCardNumber} from '../payment/card';
import {TEST_CARDS, WRONG_PASSWORD} from './constants';
import {customer, markPaid, startPayment, takePayment} from './db';

export {TEST_CARDS, WRONG_PASSWORD} from './constants';

const API = '*/api/:tenant';
const LATENCY = 400;

const error = (status: number, code: ApiErrorCode) => HttpResponse.json({code}, {status});

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
      return error(404, 'not_found');
    }
    const {email, password} = (await request.json()) as {email?: string; password?: string};
    if (!email || !password || password === WRONG_PASSWORD) {
      return error(401, 'invalid_credentials');
    }
    const {account} = customer(params.tenant, email);
    const session: Session = {token: btoa(JSON.stringify({tenant: params.tenant, email})), name: account.name, email};
    return HttpResponse.json(session);
  }),

  http.get<{tenant: string}>(`${API}/account`, async ({request, params}) => {
    await delay(LATENCY);
    const email = who(request, params.tenant);
    return email ? HttpResponse.json(customer(params.tenant, email).account) : error(401, 'session_expired');
  }),

  http.get<{tenant: string}>(`${API}/invoices`, async ({request, params}) => {
    await delay(LATENCY);
    const email = who(request, params.tenant);
    return email ? HttpResponse.json(customer(params.tenant, email).invoices) : error(401, 'session_expired');
  }),

  http.post<{tenant: string; invoiceId: string}>(`${API}/invoices/:invoiceId/payments`, async ({request, params}) => {
    await delay(LATENCY * 2);
    const email = who(request, params.tenant);
    if (!email) {
      return error(401, 'session_expired');
    }
    const invoice = customer(params.tenant, email).invoices.find(({id}) => id === params.invoiceId);
    if (!invoice || invoice.status === 'paid') {
      return error(409, 'already_paid');
    }
    const card = (await request.json()) as Partial<Card>;
    const number = normaliseCardNumber(card.number ?? '');
    if (!isCardNumber(number) || !isExpiry(card.expiry ?? '') || !isCvc(card.cvc ?? '')) {
      return error(400, 'invalid_card');
    }
    if (number === normaliseCardNumber(TEST_CARDS.declined)) {
      return error(402, 'card_declined');
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
      : error(404, 'not_found');
  }),

  http.post<{tenant: string; paymentId: string}>(`${API}/payments/:paymentId/confirm`, async ({request, params}) => {
    await delay(LATENCY);
    const email = who(request, params.tenant);
    const payment = takePayment(params.paymentId);
    if (!email || payment?.email !== email) {
      return error(404, 'payment_expired');
    }
    const {approved} = (await request.json()) as {approved?: boolean};
    if (!approved) {
      return error(402, 'payment_not_confirmed');
    }
    const paid = markPaid(params.tenant, email, payment.invoiceId);
    return paid
      ? HttpResponse.json({status: 'succeeded', invoice: paid} satisfies PaymentOutcome)
      : error(404, 'not_found');
  }),
];

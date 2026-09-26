import {startMocks} from '../mocks/start';
import {type Account, ApiError, type Card, type Invoice, type PaymentOutcome, type Session} from './types';

/** API URLs live under the app's base path, so the mock service worker's scope covers them. */
export function apiUrl(tenant: string, path: string): URL {
  return new URL(`${import.meta.env.BASE_URL}api/${tenant}/${path}`, window.location.origin);
}

async function request<T>(tenant: string, path: string, init: {token?: string; body?: unknown} = {}): Promise<T> {
  await startMocks();
  const headers: Record<string, string> = {'content-type': 'application/json'};
  if (init.token) {
    headers.authorization = `Bearer ${init.token}`;
  }
  const response = await fetch(apiUrl(tenant, path), {
    method: init.body === undefined ? 'GET' : 'POST',
    headers,
    ...(init.body === undefined ? {} : {body: JSON.stringify(init.body)}),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string'
        ? payload.message
        : 'Something went wrong. Please try again.';
    throw new ApiError(response.status, message);
  }
  // The mock API is ours and typed by the same module; a real one would be validated here.
  return payload as T;
}

export const api = {
  signIn: (tenant: string, email: string, password: string) =>
    request<Session>(tenant, 'session', {body: {email, password}}),
  account: (tenant: string, token: string) => request<Account>(tenant, 'account', {token}),
  invoices: (tenant: string, token: string) => request<Invoice[]>(tenant, 'invoices', {token}),
  pay: (tenant: string, token: string, invoiceId: string, card: Card) =>
    request<PaymentOutcome>(tenant, `invoices/${invoiceId}/payments`, {token, body: card}),
  confirm: (tenant: string, token: string, paymentId: string, approved: boolean) =>
    request<PaymentOutcome>(tenant, `payments/${paymentId}/confirm`, {token, body: {approved}}),
};

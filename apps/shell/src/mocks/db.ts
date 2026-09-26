import type {Account, Invoice, InvoiceStatus} from '../api/types';

/**
 * The mock API's data. Each customer is made up from their email address, so any address signs in and gets
 * the same account every time; addresses starting with "new" get an account without invoices. Paid invoices
 * are remembered for the browser session (sessionStorage), so a reload keeps them paid.
 */

interface Customer {
  account: Account;
  invoices: Invoice[];
}

interface Payment {
  tenant: string;
  email: string;
  invoiceId: string;
}

const STORAGE_KEY = 'livery:mock-db';
const memory = new Map<string, string[]>();
const payments = new Map<string, Payment>();

function hash(text: string): number {
  let value = 2166136261;
  for (const character of text) {
    value = Math.imul(value ^ character.charCodeAt(0), 16777619);
  }
  return value >>> 0;
}

const isoDate = (date: Date): string => date.toISOString().slice(0, 10);
const daysFromToday = (days: number): string => isoDate(new Date(Date.now() + days * 86_400_000));

function paidIds(key: string): string[] {
  if (typeof sessionStorage === 'undefined') {
    return memory.get(key) ?? [];
  }
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}');
    const ids: unknown = typeof stored === 'object' && stored !== null ? Reflect.get(stored, key) : undefined;
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function rememberPaid(key: string, ids: string[]): void {
  if (typeof sessionStorage === 'undefined') {
    memory.set(key, ids);
    return;
  }
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}');
    const all = typeof stored === 'object' && stored !== null ? stored : {};
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({...all, [key]: ids}));
  } catch {
    memory.set(key, ids);
  }
}

const PLANS = ['essential', 'plus', 'business'] as const;

export function customer(tenant: string, email: string): Customer {
  const seed = hash(`${tenant}:${email.toLowerCase()}`);
  const key = `${tenant}:${email.toLowerCase()}`;
  const local = email.split('@')[0] ?? email;
  const name = local.charAt(0).toUpperCase() + local.slice(1);
  const paid = new Set(paidIds(key));

  const statuses: InvoiceStatus[] = ['overdue', 'open', 'paid', 'paid'];
  const invoices = email.toLowerCase().startsWith('new')
    ? []
    : statuses.map((status, index): Invoice => {
        const id = `inv-${(seed % 9000) + 1000}-${index + 1}`;
        const monthsAgo = index;
        return {
          id,
          number: `${tenant.slice(0, 3).toUpperCase()}-2026-${String((seed % 90) + 10 + index)}`,
          issuedOn: daysFromToday(-30 * monthsAgo - 20),
          dueOn: daysFromToday(status === 'overdue' ? -5 : -30 * monthsAgo + 10),
          amountMinor: 2900 + ((seed >> (index * 4)) % 40) * 250,
          status: paid.has(id) ? 'paid' : status,
        };
      });

  return {
    account: {
      name,
      email,
      plan: PLANS[seed % PLANS.length] ?? 'essential',
      memberSince: daysFromToday(-400 - (seed % 300)),
    },
    invoices,
  };
}

export function markPaid(tenant: string, email: string, invoiceId: string): Invoice | undefined {
  const key = `${tenant}:${email.toLowerCase()}`;
  rememberPaid(key, [...new Set([...paidIds(key), invoiceId])]);
  return customer(tenant, email).invoices.find((invoice) => invoice.id === invoiceId);
}

export function startPayment(payment: Payment): string {
  const id = `pay-${hash(`${payment.invoiceId}:${Date.now()}:${payments.size}`).toString(36)}`;
  payments.set(id, payment);
  return id;
}

export function takePayment(id: string): Payment | undefined {
  const payment = payments.get(id);
  payments.delete(id);
  return payment;
}

/** Forgets everything; for tests. */
export function resetDb(): void {
  memory.clear();
  payments.clear();
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

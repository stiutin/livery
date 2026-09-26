import {describe, expect, it} from 'vitest';

import type {Invoice} from '../api/types';
import {initialPayment, type PaymentEvent, paymentReducer, type PaymentState} from './machine';

const invoice: Invoice = {
  id: 'inv-1',
  number: 'HAR-2026-11',
  issuedOn: '2026-08-01',
  dueOn: '2026-09-01',
  amountMinor: 4900,
  status: 'open',
};
const paid: Invoice = {...invoice, status: 'paid'};
const run = (...events: PaymentEvent[]): PaymentState => events.reduce(paymentReducer, initialPayment);

describe('paymentReducer', () => {
  it('goes from a form to a paid invoice', () => {
    expect(run({type: 'open', invoice}, {type: 'submit'}, {type: 'succeeded', invoice: paid})).toEqual({
      status: 'succeeded',
      invoice: paid,
    });
  });

  it('asks the customer to confirm when the bank wants it, then submits again', () => {
    const confirming = run({type: 'open', invoice}, {type: 'submit'}, {type: 'requiresAction', paymentId: 'pay-1'});
    expect(confirming).toEqual({status: 'confirming', invoice, paymentId: 'pay-1'});
    expect(paymentReducer(confirming, {type: 'answer'})).toEqual({status: 'submitting', invoice});
  });

  it('returns to the form with the reason when a payment fails', () => {
    expect(run({type: 'open', invoice}, {type: 'submit'}, {type: 'failed', message: 'Declined'})).toEqual({
      status: 'editing',
      invoice,
      error: 'Declined',
    });
  });

  it('cannot be closed while the bank is working, or submitted twice', () => {
    const submitting = run({type: 'open', invoice}, {type: 'submit'});
    expect(paymentReducer(submitting, {type: 'close'})).toBe(submitting);
    expect(paymentReducer(submitting, {type: 'submit'})).toBe(submitting);
  });

  it('ignores answers that arrive when nothing is waiting for them', () => {
    expect(run({type: 'succeeded', invoice: paid})).toBe(initialPayment);
    const editing = run({type: 'open', invoice});
    expect(paymentReducer(editing, {type: 'succeeded', invoice: paid})).toBe(editing);
  });

  it('closes from the form and after success', () => {
    expect(run({type: 'open', invoice}, {type: 'close'})).toBe(initialPayment);
    expect(run({type: 'open', invoice}, {type: 'submit'}, {type: 'succeeded', invoice: paid}, {type: 'close'})).toBe(
      initialPayment
    );
  });
});

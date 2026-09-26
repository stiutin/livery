import {describe, expect, it} from 'vitest';

import {api} from '../api/client';
import {ApiError} from '../api/types';
import {TEST_CARDS, WRONG_PASSWORD} from './handlers';

const card = (number: string) => ({number, expiry: '12/40', cvc: '123'});

describe('the mock API', () => {
  it('signs in any address with a valid password and refuses the wrong one', async () => {
    const session = await api.signIn('meadow', 'ada@example.com', 'secret');
    expect(session).toMatchObject({name: 'Ada', email: 'ada@example.com'});
    await expect(api.signIn('meadow', 'ada@example.com', WRONG_PASSWORD)).rejects.toMatchObject({status: 401});
  });

  it('answers only with a token for the same tenant', async () => {
    const {token} = await api.signIn('meadow', 'ada@example.com', 'secret');
    expect(await api.invoices('meadow', token)).toHaveLength(4);
    await expect(api.invoices('onyx', token)).rejects.toBeInstanceOf(ApiError);
  });

  it('gives the same customer the same invoices every time, and new customers none', async () => {
    const {token} = await api.signIn('onyx', 'ada@example.com', 'secret');
    expect(await api.invoices('onyx', token)).toEqual(await api.invoices('onyx', token));
    const fresh = await api.signIn('onyx', 'new.customer@example.com', 'secret');
    expect(await api.invoices('onyx', fresh.token)).toEqual([]);
  });

  it('pays, declines or asks the bank according to the test card', async () => {
    const {token} = await api.signIn('onyx', 'ada@example.com', 'secret');
    const [overdue, open] = await api.invoices('onyx', token);
    if (!overdue || !open) {
      throw new Error('expected unpaid invoices');
    }

    await expect(api.pay('onyx', token, overdue.id, card(TEST_CARDS.declined))).rejects.toMatchObject({status: 402});

    const pending = await api.pay('onyx', token, overdue.id, card(TEST_CARDS.confirm));
    expect(pending.status).toBe('requires_action');
    if (pending.status === 'requires_action') {
      const confirmed = await api.confirm('onyx', token, pending.paymentId, true);
      expect(confirmed).toMatchObject({status: 'succeeded', invoice: {id: overdue.id, status: 'paid'}});
    }

    expect(await api.pay('onyx', token, open.id, card(TEST_CARDS.success))).toMatchObject({status: 'succeeded'});
    await expect(api.pay('onyx', token, open.id, card(TEST_CARDS.success))).rejects.toMatchObject({status: 409});
  });

  it('charges nothing when the customer declines the bank confirmation', async () => {
    const {token} = await api.signIn('harbour', 'ada@example.com', 'secret');
    const [overdue] = await api.invoices('harbour', token);
    const pending = await api.pay('harbour', token, overdue?.id ?? '', card(TEST_CARDS.confirm));
    if (pending.status !== 'requires_action') {
      throw new Error('expected a confirmation');
    }
    await expect(api.confirm('harbour', token, pending.paymentId, false)).rejects.toMatchObject({status: 402});
    expect((await api.invoices('harbour', token))[0]?.status).toBe('overdue');
  });
});

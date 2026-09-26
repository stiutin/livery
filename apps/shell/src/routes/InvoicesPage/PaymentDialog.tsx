import {Button, Dialog, Field, Input} from '@livery/ui';
import {useEffect, useReducer} from 'react';
import {useForm} from 'react-hook-form';

import {api} from '../../api/client';
import type {Card, Invoice, PaymentOutcome, Session} from '../../api/types';
import {TEST_CARDS} from '../../mocks/handlers';
import {isCardNumber, isCvc, isExpiry} from '../../payment/card';
import {initialPayment, paymentReducer} from '../../payment/machine';
import {useTenant} from '../../tenant/useTenant';
import {formatMoney} from '../../utils/formatters.utils';
import styles from './InvoicesPage.module.css';

interface Props {
  invoice: Invoice;
  session: Session;
  /** Called with the paid invoice after a payment, or with null when the customer gives up. */
  onClose: (paid: Invoice | null) => void;
}

/** The card payment of one invoice, driven by the payment state machine. */
export default function PaymentDialog({invoice, session, onClose}: Props) {
  const {brandId, locale, currency} = useTenant();
  const [state, dispatch] = useReducer(paymentReducer, initialPayment);
  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<Card>({mode: 'onTouched'});

  useEffect(() => {
    dispatch({type: 'open', invoice});
  }, [invoice]);

  const settle = (outcome: PaymentOutcome) => {
    dispatch(
      outcome.status === 'succeeded'
        ? {type: 'succeeded', invoice: outcome.invoice}
        : {type: 'requiresAction', paymentId: outcome.paymentId}
    );
  };
  const fail = (error: unknown) => {
    dispatch({type: 'failed', message: error instanceof Error ? error.message : 'The payment failed.'});
  };

  const pay = (card: Card) => {
    dispatch({type: 'submit'});
    api.pay(brandId, session.token, invoice.id, card).then(settle, fail);
  };
  const answer = (approved: boolean) => {
    if (state.status !== 'confirming') {
      return;
    }
    dispatch({type: 'answer'});
    api.confirm(brandId, session.token, state.paymentId, approved).then(settle, fail);
  };
  const close = () => {
    if (state.status === 'succeeded') {
      onClose(state.invoice);
    } else if (state.status === 'editing') {
      onClose(null);
    }
  };

  const amount = formatMoney(invoice.amountMinor, currency, locale);
  const busy = state.status === 'submitting';

  return (
    <Dialog
      open={state.status !== 'closed'}
      onClose={close}
      title={state.status === 'succeeded' ? 'Payment received' : `Pay ${invoice.number}`}
    >
      {state.status === 'succeeded' && (
        <div className={styles.flow}>
          <p role="status">
            {amount} is paid. A receipt is on its way to {session.email}.
          </p>
          <Button onClick={close}>Done</Button>
        </div>
      )}

      {state.status === 'confirming' && (
        <div className={styles.flow}>
          <p role="status">Your bank asks you to confirm this payment of {amount}.</p>
          <div className={styles.actions}>
            <Button
              variant="secondary"
              onClick={() => {
                answer(false);
              }}
            >
              Decline
            </Button>
            <Button
              onClick={() => {
                answer(true);
              }}
            >
              Confirm payment
            </Button>
          </div>
        </div>
      )}

      {(state.status === 'editing' || state.status === 'submitting') && (
        <form
          className={styles.flow}
          noValidate
          aria-busy={busy}
          onSubmit={(event) => {
            void handleSubmit(pay)(event);
          }}
        >
          <p>
            Amount due: <strong>{amount}</strong>
          </p>
          <Field
            label="Card number"
            hint={`Test cards: ${TEST_CARDS.success} pays, ${TEST_CARDS.declined} is declined, ${TEST_CARDS.confirm} asks your bank.`}
            error={errors.number?.message}
          >
            {(control) => (
              <Input
                {...control}
                inputMode="numeric"
                autoComplete="cc-number"
                {...register('number', {validate: (v) => isCardNumber(v) || 'Enter a valid card number'})}
              />
            )}
          </Field>
          <div className={styles.pair}>
            <Field label="Expiry (MM/YY)" error={errors.expiry?.message}>
              {(control) => (
                <Input
                  {...control}
                  autoComplete="cc-exp"
                  {...register('expiry', {validate: (v) => isExpiry(v) || 'Enter a future date as MM/YY'})}
                />
              )}
            </Field>
            <Field label="Security code" error={errors.cvc?.message}>
              {(control) => (
                <Input
                  {...control}
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  {...register('cvc', {validate: (v) => isCvc(v) || 'Enter the 3 or 4 digits'})}
                />
              )}
            </Field>
          </div>
          {state.status === 'editing' && state.error && (
            <div className="error" role="alert">
              {state.error}
            </div>
          )}
          <Button type="submit" loading={busy} fullWidth>
            {busy ? 'Paying…' : `Pay ${amount}`}
          </Button>
        </form>
      )}
    </Dialog>
  );
}

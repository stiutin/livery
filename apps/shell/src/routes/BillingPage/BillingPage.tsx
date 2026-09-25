import {useState} from 'react';

import BackToHome from '../../components/BackToHome/BackToHome';
import {MAX_AMOUNT} from '../../constants/common.const';
import {billingApi} from '../../services/billingApi';
import {useTenant} from '../../tenant/useTenant';
import {useThemeComponents} from '../../theme/useThemeComponents';
import type {BillingState} from '../../types/billingState';
import {formatCurrency, parseAmount} from '../../utils/formatters.utils';

export default function BillingPage() {
  const {brandId, currency, locale} = useTenant();
  const {BrandButton} = useThemeComponents();
  const [amountText, setAmountText] = useState('');
  const [state, setState] = useState<BillingState>({status: 'idle'});

  async function onSubmit(e: {preventDefault(): void}) {
    e.preventDefault();

    setState({status: 'idle'});

    const amount = parseAmount(amountText);

    if (!Number.isFinite(amount) || amount <= 0) {
      setState({
        status: 'error',
        message: 'Enter a valid billing amount greater than 0',
      });

      return;
    }

    if (amount > MAX_AMOUNT) {
      setState({
        status: 'error',
        message: `Amount must not exceed ${formatCurrency(MAX_AMOUNT, currency, locale)}.`,
      });

      return;
    }

    setState({status: 'loading'});

    try {
      const result = await billingApi.createInvoice({
        brandId,
        amount,
        currency,
      });

      if (!result) {
        setState({
          status: 'empty',
          message: 'No invoice generated for this tenant',
        });
        return;
      }

      setState({status: 'success', result});
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Billing failed';
      setState({status: 'error', message});
    }
  }

  function handleReset() {
    setAmountText('');
    setState({status: 'idle'});
  }

  return (
    <div className="page">
      <h1 className="h1">Billing</h1>

      <p className="notice">
        Tenant: <strong>{brandId}</strong> · Currency: <strong>{currency}</strong>
      </p>

      {state.status === 'success' ? (
        <div className="success-card" role="status" aria-live="polite">
          <div className="success-card__icon" aria-hidden="true">
            ✓
          </div>
          <h2 className="success-card__title">Invoice created</h2>
          <p className="success-card__detail">
            <span className="success-card__label">Invoice ID</span>
            <code className="success-card__value">{state.result.invoiceId}</code>
          </p>
          <p className="success-card__detail">
            <span className="success-card__label">Amount</span>
            <strong className="success-card__value">{formatCurrency(state.result.amount, currency, locale)}</strong>
          </p>
          <BrandButton onClick={handleReset} style={{marginTop: 8}}>
            Create another invoice
          </BrandButton>
        </div>
      ) : (
        <form
          className="form"
          onSubmit={(event) => {
            void onSubmit(event);
          }}
          aria-busy={state.status === 'loading'}
          noValidate
        >
          <div className="field">
            <label htmlFor="amount">Billing amount ({currency})</label>
            <input
              id="amount"
              name="amount"
              type="text"
              inputMode="decimal"
              placeholder="e.g. 49.99"
              value={amountText}
              onChange={(e) => {
                setAmountText(e.target.value);
              }}
              aria-describedby={state.status === 'error' ? 'billing-error' : undefined}
              aria-invalid={state.status === 'error'}
            />
          </div>

          {state.status === 'error' && (
            <div id="billing-error" className="error" role="alert">
              {state.message}
            </div>
          )}

          {state.status === 'empty' && (
            <div className="notice" role="status" aria-live="polite">
              {state.message}
            </div>
          )}

          <BrandButton type="submit" disabled={state.status === 'loading'} style={{width: '100%'}}>
            {state.status === 'loading' ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Creating invoice…
              </>
            ) : (
              'Create invoice'
            )}
          </BrandButton>

          <BackToHome />
        </form>
      )}
    </div>
  );
}

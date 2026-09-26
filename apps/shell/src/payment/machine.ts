import type {Invoice} from '../api/types';

/**
 * The payment flow as a finite state machine. Every screen of the payment dialog is one state, every button
 * and every answer from the API is one event, and anything a state does not expect is ignored, so a double
 * click or a late response cannot put the flow somewhere it should not be.
 *
 *   closed ──open──▶ editing ──submit──▶ submitting ──succeeded──▶ succeeded ──close──▶ closed
 *                      ▲                  │   │
 *                      └──── declined ────┘   └─requires action─▶ confirming ──approve/decline──▶ submitting
 */
export type PaymentState =
  | {readonly status: 'closed'}
  | {readonly status: 'editing'; readonly invoice: Invoice; readonly error?: string}
  | {readonly status: 'submitting'; readonly invoice: Invoice}
  | {readonly status: 'confirming'; readonly invoice: Invoice; readonly paymentId: string}
  | {readonly status: 'succeeded'; readonly invoice: Invoice};

export type PaymentEvent =
  | {readonly type: 'open'; readonly invoice: Invoice}
  | {readonly type: 'submit'}
  | {readonly type: 'requiresAction'; readonly paymentId: string}
  | {readonly type: 'answer'}
  | {readonly type: 'succeeded'; readonly invoice: Invoice}
  | {readonly type: 'failed'; readonly message: string}
  | {readonly type: 'close'};

export const initialPayment: PaymentState = {status: 'closed'};

export function paymentReducer(state: PaymentState, event: PaymentEvent): PaymentState {
  switch (state.status) {
    case 'closed':
      return event.type === 'open' ? {status: 'editing', invoice: event.invoice} : state;
    case 'editing':
      if (event.type === 'submit') {
        return {status: 'submitting', invoice: state.invoice};
      }
      return event.type === 'close' ? initialPayment : state;
    case 'submitting':
      switch (event.type) {
        case 'succeeded':
          return {status: 'succeeded', invoice: event.invoice};
        case 'requiresAction':
          return {status: 'confirming', invoice: state.invoice, paymentId: event.paymentId};
        case 'failed':
          return {status: 'editing', invoice: state.invoice, error: event.message};
        default:
          // Closing while the bank is working would hide a charge; the dialog stays until it answers.
          return state;
      }
    case 'confirming':
      if (event.type === 'answer') {
        return {status: 'submitting', invoice: state.invoice};
      }
      return state;
    case 'succeeded':
      return event.type === 'close' ? initialPayment : state;
  }
}

import {act, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {Button} from '../Button/Button';
import {ToastProvider} from './Toast';
import {type ToastTone, useToast} from './useToast';

function Trigger({message, tone}: {message: string; tone?: ToastTone}) {
  const toast = useToast();
  return (
    <Button
      onClick={() => {
        toast(message, tone ? {tone} : {});
      }}
    >
      Notify
    </Button>
  );
}

const renderWith = (tone?: ToastTone) =>
  render(
    <ToastProvider>
      <Trigger message="Invoice created" {...(tone ? {tone} : {})} />
    </ToastProvider>
  );

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('announces toasts in a live region that is there from the start', () => {
    renderWith();
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toBeEmptyDOMElement();

    fireEvent.click(screen.getByRole('button', {name: 'Notify'}));
    expect(status).toHaveTextContent('Invoice created');
  });

  it('leaves on its own, but not while the pointer is over the region', () => {
    renderWith('success');
    fireEvent.click(screen.getByRole('button', {name: 'Notify'}));
    const region = screen.getByRole('region', {name: 'Notifications'});

    fireEvent.pointerEnter(region);
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByRole('status')).toHaveTextContent('Invoice created');

    fireEvent.pointerLeave(region);
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('keeps errors until they are dismissed', () => {
    renderWith('danger');
    fireEvent.click(screen.getByRole('button', {name: 'Notify'}));
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByRole('status')).toHaveTextContent('Invoice created');

    fireEvent.click(screen.getByRole('button', {name: 'Dismiss notification'}));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('refuses to work without a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Trigger message="x" />)).toThrow('useToast() needs a <ToastProvider> above it');
  });
});

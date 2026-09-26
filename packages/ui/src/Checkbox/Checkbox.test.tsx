import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';

import {Checkbox} from './Checkbox';

describe('Checkbox', () => {
  it('is a checkbox named by its label and described by its hint', async () => {
    const onChange = vi.fn();
    render(<Checkbox label="Card payments" hint="Customers pay invoices by card." onChange={onChange} />);
    const checkbox = screen.getByRole('checkbox', {name: 'Card payments'});
    expect(checkbox).toHaveAccessibleDescription('Customers pay invoices by card.');

    await userEvent.click(screen.getByText('Card payments'));
    expect(checkbox).toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

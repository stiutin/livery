import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {Select} from '../Select/Select';
import {Field, Input} from './Field';

describe('Field', () => {
  it('names the control with its label and describes it with the hint', () => {
    render(
      <Field label="Email address" hint="We never share it.">
        {(control) => <Input {...control} />}
      </Field>
    );
    const input = screen.getByRole('textbox', {name: 'Email address'});
    expect(input).toHaveAccessibleDescription('We never share it.');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('marks the control invalid and announces the error', () => {
    render(
      <Field label="Email address" hint="We never share it." error="Enter a valid email address">
        {(control) => <Input {...control} />}
      </Field>
    );
    const input = screen.getByRole('textbox', {name: 'Email address'});
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('We never share it. Enter a valid email address');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address');
  });

  it('works with a select', () => {
    render(
      <Field label="Currency">
        {(control) => (
          <Select {...control} defaultValue="EUR">
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </Select>
        )}
      </Field>
    );
    expect(screen.getByRole('combobox', {name: 'Currency'})).toHaveValue('EUR');
  });

  it('gives every field its own ids', () => {
    render(
      <>
        <Field label="First">{(control) => <Input {...control} />}</Field>
        <Field label="Second">{(control) => <Input {...control} />}</Field>
      </>
    );
    expect(screen.getByRole('textbox', {name: 'First'}).id).not.toBe(screen.getByRole('textbox', {name: 'Second'}).id);
  });
});

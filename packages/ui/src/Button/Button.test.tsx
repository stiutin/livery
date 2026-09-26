import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';

import {Button} from './Button';

describe('Button', () => {
  it('is a primary button that does not submit forms unless asked', () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole('button', {name: 'Save'});
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('data-variant', 'primary');
  });

  it('is busy and disabled while loading, and ignores clicks', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Saving
      </Button>
    );
    const button = screen.getByRole('button', {name: 'Saving'});
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('passes the variant and native attributes through', () => {
    render(
      <Button variant="secondary" type="submit" name="intent">
        Cancel
      </Button>
    );
    const button = screen.getByRole('button', {name: 'Cancel'});
    expect(button).toHaveAttribute('data-variant', 'secondary');
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('name', 'intent');
    expect(button).not.toHaveAttribute('aria-busy');
  });
});

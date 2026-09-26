import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {useState} from 'react';
import {describe, expect, it} from 'vitest';

import {Button} from '../Button/Button';
import {Dialog} from './Dialog';

function Example() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
        }}
      >
        Delete invoice
      </Button>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        title="Delete this invoice?"
        footer={
          <Button
            variant="secondary"
            onClick={() => {
              setOpen(false);
            }}
          >
            Keep it
          </Button>
        }
      >
        It cannot be restored.
      </Dialog>
    </>
  );
}

describe('Dialog', () => {
  it('opens as a dialog named by its title', async () => {
    render(<Example />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', {name: 'Delete invoice'}));
    expect(screen.getByRole('dialog', {name: 'Delete this invoice?'})).toHaveTextContent('It cannot be restored.');
  });

  it('closes from the close button and from its own actions', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', {name: 'Delete invoice'}));
    await userEvent.click(screen.getByRole('button', {name: 'Close'}));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', {name: 'Delete invoice'}));
    await userEvent.click(screen.getByRole('button', {name: 'Keep it'}));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on a click on the backdrop, not on the panel', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', {name: 'Delete invoice'}));
    const dialog = screen.getByRole('dialog');

    await userEvent.click(screen.getByText('It cannot be restored.'));
    expect(dialog).toHaveAttribute('open');

    await userEvent.click(dialog);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

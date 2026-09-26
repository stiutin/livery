import type {CompiledToken, LoadedTenant} from '@livery/tokens';
import {Button, Card, Dialog, Field, Input, Select, Table, type TableColumn, useToast} from '@livery/ui';
import {useState} from 'react';
import {useRouteLoaderData} from 'react-router';

import styles from './ThemePreview.module.css';

type Token = CompiledToken;

const COLUMNS: readonly TableColumn<Token>[] = [
  {
    key: 'swatch',
    header: <span className={styles.visuallyHidden}>Swatch</span>,
    cell: (token) => <span className={styles.swatch} style={{background: `var(${token.cssVariable})`}} />,
  },
  {key: 'name', header: 'Token', cell: (token) => <code>{token.path.replace('semantic.color.', '')}</code>},
  {key: 'value', header: 'Value', cell: (token) => <code>{token.resolvedCss}</code>},
];

/** Every component of @livery/ui in the active brand, with the brand's compiled colours. */
export default function ThemePreview() {
  const tenant = useRouteLoaderData<LoadedTenant>('tenant');
  const toast = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const tokenSet = tenant?.tokenSet ?? '';
  const colours = tenant?.tokens.filter((token) => token.type === 'color' && token.path.startsWith('semantic.')) ?? [];

  return (
    <div className="page">
      <h1 className="h1">Theme preview</h1>

      <p className="description">Every component in the {tokenSet} brand, and the colours compiled from its tokens.</p>

      <Card className={styles.section}>
        <h2 className="h3">Buttons</h2>
        <div className={styles.row}>
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button loading>Saving…</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Card>

      <Card className={styles.section}>
        <h2 className="h3">Fields</h2>
        <div className={styles.stack}>
          <Field label="Full name" hint="As it appears on your card.">
            {(control) => <Input {...control} autoComplete="off" />}
          </Field>
          <Field label="Email address" error="Enter a valid email address">
            {(control) => <Input {...control} defaultValue="ada@" autoComplete="off" />}
          </Field>
          <Field label="Plan">
            {(control) => (
              <Select {...control} defaultValue="team">
                <option value="solo">Solo</option>
                <option value="team">Team</option>
                <option value="enterprise">Enterprise</option>
              </Select>
            )}
          </Field>
        </div>
      </Card>

      <Card className={styles.section}>
        <h2 className="h3">Dialog and notifications</h2>
        <div className={styles.row}>
          <Button
            variant="secondary"
            onClick={() => {
              setDialogOpen(true);
            }}
          >
            Open dialog
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              toast('Invoice sent', {tone: 'success'});
            }}
          >
            Show a notification
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              toast('The payment was declined', {tone: 'danger'});
            }}
          >
            Show an error
          </Button>
        </div>
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
        }}
        title="Cancel the subscription?"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setDialogOpen(false);
              }}
            >
              Keep it
            </Button>
            <Button
              onClick={() => {
                setDialogOpen(false);
                toast('Subscription cancelled');
              }}
            >
              Cancel subscription
            </Button>
          </>
        }
      >
        You keep access until the end of the billing period.
      </Dialog>

      <Table
        className={styles.section}
        caption={`Semantic colours of ${tokenSet}`}
        columns={COLUMNS}
        rows={colours}
        rowKey={(token) => token.cssVariable}
      />
    </div>
  );
}

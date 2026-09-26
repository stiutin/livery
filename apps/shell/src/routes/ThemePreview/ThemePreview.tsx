import type {CompiledToken} from '@livery/tokens';
import {Button, Card, Dialog, Field, Input, Select, Table, type TableColumn, useToast} from '@livery/ui';
import {useState} from 'react';
import {useRouteLoaderData} from 'react-router';

import {useI18n} from '../../i18n/useI18n';
import type {TenantRouteData} from '../tenant';
import styles from './ThemePreview.module.css';

type Token = CompiledToken;

/** Every component of @livery/ui in the active brand, with the brand's compiled colours. */
export default function ThemePreview() {
  const tenant = useRouteLoaderData<TenantRouteData>('tenant')?.tenant;
  const {t} = useI18n();
  const columns: readonly TableColumn<Token>[] = [
    {
      key: 'swatch',
      header: <span className={styles.visuallyHidden}>{t('preview.swatch')}</span>,
      cell: (token) => <span className={styles.swatch} style={{background: `var(${token.cssVariable})`}} />,
    },
    {
      key: 'name',
      header: t('preview.token'),
      cell: (token) => <code>{token.path.replace('semantic.color.', '')}</code>,
    },
    {key: 'value', header: t('preview.value'), cell: (token) => <code>{token.resolvedCss}</code>},
  ];
  const toast = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const tokenSet = tenant?.tokenSet ?? '';
  const colours = tenant?.tokens.filter((token) => token.type === 'color' && token.path.startsWith('semantic.')) ?? [];

  return (
    <div className="page">
      <h1 className="h1">{t('preview.title')}</h1>

      <p className="description">{t('preview.intro', {tokenSet})}</p>

      <Card className={styles.section}>
        <h2 className="h3">{t('preview.buttons')}</h2>
        <div className={styles.row}>
          <Button>{t('preview.primary')}</Button>
          <Button variant="secondary">{t('preview.secondary')}</Button>
          <Button loading>{t('preview.saving')}</Button>
          <Button disabled>{t('preview.disabled')}</Button>
        </div>
      </Card>

      <Card className={styles.section}>
        <h2 className="h3">{t('preview.fields')}</h2>
        <div className={styles.stack}>
          <Field label={t('preview.fullName')} hint={t('preview.fullNameHint')}>
            {(control) => <Input {...control} autoComplete="off" />}
          </Field>
          <Field label={t('login.email')} error={t('login.emailInvalid')}>
            {(control) => <Input {...control} defaultValue="ada@" autoComplete="off" />}
          </Field>
          <Field label={t('preview.plan')}>
            {(control) => (
              <Select {...control} defaultValue="plus">
                <option value="essential">{t('plan.essential')}</option>
                <option value="plus">{t('plan.plus')}</option>
                <option value="business">{t('plan.business')}</option>
              </Select>
            )}
          </Field>
        </div>
      </Card>

      <Card className={styles.section}>
        <h2 className="h3">{t('preview.dialogs')}</h2>
        <div className={styles.row}>
          <Button
            variant="secondary"
            onClick={() => {
              setDialogOpen(true);
            }}
          >
            {t('preview.openDialog')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              toast(t('preview.invoiceSent'), {tone: 'success'});
            }}
          >
            {t('preview.showNotification')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              toast(t('preview.declined'), {tone: 'danger'});
            }}
          >
            {t('preview.showError')}
          </Button>
        </div>
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
        }}
        title={t('preview.dialogTitle')}
        closeLabel={t('ui.close')}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setDialogOpen(false);
              }}
            >
              {t('preview.keep')}
            </Button>
            <Button
              onClick={() => {
                setDialogOpen(false);
                toast(t('preview.cancelled'));
              }}
            >
              {t('preview.cancel')}
            </Button>
          </>
        }
      >
        {t('preview.dialogBody')}
      </Dialog>

      <Table
        className={styles.section}
        caption={t('preview.colours', {tokenSet})}
        columns={columns}
        rows={colours}
        rowKey={(token) => token.cssVariable}
      />
    </div>
  );
}

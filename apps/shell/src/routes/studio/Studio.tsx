import {checkBrand, DENSITIES, FONTS, MAX_RADIUS, type StudioSettings} from '@livery/tokens';
import baseTokens from '@livery/tokens/base.tokens.json';
import {Button, Card, Checkbox, Field, Input, Select, Table, ToastProvider, useToast} from '@livery/ui';
import {useMemo, useState} from 'react';
import {Link} from 'react-router';
import {tenants} from 'virtual:livery/tenants';

import {type Language, LANGUAGE_CODES, LANGUAGES} from '../../i18n/languages';
import styles from './Studio.module.css';
import {type PreviewPage, StudioPreview} from './StudioPreview';
import {useStudioSettings} from './useStudioSettings';

const BASE = {name: 'base.tokens.json', json: baseTokens};
const LOCALES = ['en-GB', 'en-US', 'de-DE', 'de-AT', 'de-CH', 'es-ES', 'es-MX'];
const CURRENCIES = ['GBP', 'USD', 'EUR', 'CHF', 'MXN'];
const PAGES: {id: PreviewPage; label: string}[] = [
  {id: 'home', label: 'Home'},
  {id: 'login', label: 'Sign in'},
  {id: 'components', label: 'Components'},
];

export function meta() {
  return [{title: 'Studio · Livery'}];
}

function download(fileName: string, json: unknown): void {
  const url = URL.createObjectURL(new Blob([`${JSON.stringify(json, null, 2)}\n`], {type: 'application/json'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Studio() {
  return (
    <ToastProvider>
      <StudioPage />
    </ToastProvider>
  );
}

/**
 * Livery Studio: a brand from a colour and a few choices, checked live by the same compiler as the build, and
 * exported as the two files of a tenant folder.
 */
function StudioPage() {
  const [settings, update] = useStudioSettings();
  const [page, setPage] = useState<PreviewPage>('home');
  const [language, setLanguage] = useState<Language>('en');
  const toast = useToast();
  const existing = tenants.map((tenant) => tenant.id);
  const result = useMemo(() => checkBrand(settings, BASE, existing), [settings, existing]);
  const exportable = result.problems.length === 0;
  const failing = result.tokenSet.contrast.filter((pair) => !pair.passes).length;

  const field = (key: keyof StudioSettings) => ({
    value: String(settings[key]),
    onChange: (event: {target: {value: string}}) => {
      update({[key]: event.target.value});
    },
  });

  return (
    <main className={styles.studio}>
      <header className={styles.intro}>
        <h1 className="h1">Livery Studio</h1>
        <p className="description">
          Pick a colour and a few details. Studio builds the brand&apos;s tokens in OKLCH, checks them with the same
          compiler as the build, and shows the real pages in them. Export the two files into <code>tenants/</code> and
          the brand builds with no code changes. <Link to="/">All tenants</Link>
        </p>
      </header>

      <div className={styles.layout}>
        <form
          className={styles.controls}
          aria-label="Brand settings"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <Card className={styles.group}>
            <h2 className="h3">Brand</h2>
            <Field label="Name">{(control) => <Input {...control} {...field('name')} />}</Field>
            <Field label="Id" hint={`The folder name and the address: /${settings.id}/…`}>
              {(control) => <Input {...control} {...field('id')} spellCheck={false} />}
            </Field>
            <Field label="Brand colour" hint="Everything else is derived from it.">
              {(control) => (
                <div className={styles.colour}>
                  <input
                    type="color"
                    aria-label="Pick the brand colour"
                    className={styles.swatch}
                    value={settings.color}
                    onChange={(event) => {
                      update({color: event.target.value});
                    }}
                  />
                  <Input {...control} {...field('color')} spellCheck={false} />
                </div>
              )}
            </Field>
            <Field label="Mode">
              {(control) => (
                <Select {...control} {...field('mode')}>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </Select>
              )}
            </Field>
          </Card>

          <Card className={styles.group}>
            <h2 className="h3">Shape and type</h2>
            <Field label="Font">
              {(control) => (
                <Select {...control} {...field('font')}>
                  {Object.entries(FONTS).map(([key, font]) => (
                    <option key={key} value={key}>
                      {font.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={`Corner radius: ${settings.radius}px`}>
              {(control) => (
                <input
                  {...control}
                  type="range"
                  min={0}
                  max={MAX_RADIUS}
                  className={styles.range}
                  value={settings.radius}
                  onChange={(event) => {
                    update({radius: Number(event.target.value)});
                  }}
                />
              )}
            </Field>
            <Checkbox
              label="Pill-shaped buttons"
              checked={settings.pill}
              onChange={(event) => {
                update({pill: event.target.checked});
              }}
            />
            <Field label="Density">
              {(control) => (
                <Select {...control} {...field('density')}>
                  {Object.keys(DENSITIES).map((density) => (
                    <option key={density} value={density}>
                      {density.charAt(0).toUpperCase() + density.slice(1)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </Card>

          <Card className={styles.group}>
            <h2 className="h3">Settings</h2>
            <Field label="Locale" hint="Sets the default language and how money and dates are written.">
              {(control) => (
                <Select {...control} {...field('locale')}>
                  {LOCALES.map((locale) => (
                    <option key={locale}>{locale}</option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Currency">
              {(control) => (
                <Select {...control} {...field('currency')}>
                  {CURRENCIES.map((currency) => (
                    <option key={currency}>{currency}</option>
                  ))}
                </Select>
              )}
            </Field>
            <Checkbox
              label="Card payments"
              hint="Off shows bank-transfer details instead."
              checked={settings.payments}
              onChange={(event) => {
                update({payments: event.target.checked});
              }}
            />
          </Card>
        </form>

        <section className={styles.previewColumn} aria-label="Preview">
          <div className={styles.toolbar}>
            <div role="group" aria-label="Preview page" className={styles.segmented}>
              {PAGES.map(({id, label}) => (
                <Button
                  key={id}
                  variant={page === id ? 'primary' : 'secondary'}
                  aria-pressed={page === id}
                  onClick={() => {
                    setPage(id);
                  }}
                >
                  {label}
                </Button>
              ))}
            </div>
            <Field label="Preview language" className={styles.language}>
              {(control) => (
                <Select
                  {...control}
                  value={language}
                  onChange={(event) => {
                    const next = LANGUAGE_CODES.find((code) => code === event.target.value);
                    if (next) {
                      setLanguage(next);
                    }
                  }}
                >
                  {LANGUAGE_CODES.map((code) => (
                    <option key={code} value={code}>
                      {LANGUAGES[code].name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>

          <StudioPreview
            page={page}
            language={language}
            name={settings.name || 'Untitled'}
            locale={settings.locale}
            currency={settings.currency}
            payments={settings.payments}
            tokens={result.tokenSet.tokens}
            tokenSet={settings.id}
          />
        </section>
      </div>

      <div className={styles.bottom}>
        <Card className={styles.group}>
          <h2 className="h3">Contrast</h2>
          <p role="status" className={exportable ? styles.ok : styles.bad}>
            {exportable
              ? `All ${result.tokenSet.contrast.length} contrast pairs pass WCAG AA. The brand is ready to export.`
              : `${result.problems.length} ${result.problems.length === 1 ? 'problem' : 'problems'} to fix before export${failing ? `, ${failing} of them contrast` : ''}.`}
          </p>
          {!exportable && (
            <ul className={styles.problems}>
              {result.problems.map((problem) => (
                <li key={`${problem.path}:${problem.message}`}>
                  <strong>{problem.path}</strong>: {problem.message}
                </li>
              ))}
            </ul>
          )}
          <Table
            caption="Every pair the build checks"
            columns={[
              {key: 'label', header: 'Pair', cell: (pair) => pair.label},
              {key: 'ratio', header: 'Ratio', align: 'end', cell: (pair) => `${pair.ratio.toFixed(2)}:1`},
              {key: 'minimum', header: 'Needs', align: 'end', cell: (pair) => `${pair.minimum}:1`},
              {key: 'result', header: 'Result', cell: (pair) => (pair.passes ? 'Pass' : 'Fail')},
            ]}
            rows={result.tokenSet.contrast}
            rowKey={(pair) => pair.label}
          />
        </Card>

        <Card className={styles.group}>
          <h2 className="h3">Share and export</h2>
          <p>The address of this page holds every choice; anyone who opens it sees the same brand.</p>
          <div className={styles.actions}>
            <Button
              variant="secondary"
              onClick={() => {
                void navigator.clipboard.writeText(window.location.href).then(
                  () => {
                    toast('Link copied', {tone: 'success'});
                  },
                  () => {
                    toast('Copy the address from the address bar', {tone: 'neutral'});
                  }
                );
              }}
            >
              Copy share link
            </Button>
          </div>
          <p>
            Save both files in <code>tenants/{settings.id}/</code> and run the build. Nothing else changes: the router,
            the prerendered pages and the list of tenants pick the brand up.
          </p>
          <div className={styles.actions}>
            <Button
              disabled={!exportable}
              onClick={() => {
                download('tenant.json', result.tenantJson);
              }}
            >
              Download tenant.json
            </Button>
            <Button
              disabled={!exportable}
              onClick={() => {
                download('tokens.json', result.tokensJson);
              }}
            >
              Download tokens.json
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}

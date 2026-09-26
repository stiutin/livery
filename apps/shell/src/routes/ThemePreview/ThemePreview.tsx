import {useRouteLoaderData} from 'react-router';

import {ComponentGallery} from '../../components/ComponentGallery/ComponentGallery';
import {useI18n} from '../../i18n/useI18n';
import type {TenantRouteData} from '../tenant';

/** Every component of @livery/ui in the page's brand, with the brand's compiled colours. */
export default function ThemePreview() {
  const tenant = useRouteLoaderData<TenantRouteData>('tenant')?.tenant;
  const {t} = useI18n();
  const tokenSet = tenant?.tokenSet ?? '';

  return (
    <div className="page">
      <h1 className="h1">{t('preview.title')}</h1>
      <p className="description">{t('preview.intro', {tokenSet})}</p>
      <ComponentGallery tokens={tenant?.tokens ?? []} tokenSet={tokenSet} />
    </div>
  );
}

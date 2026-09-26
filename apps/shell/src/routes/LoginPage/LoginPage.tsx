import {Button, Field, Input} from '@livery/ui';
import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {useNavigate, useSearchParams} from 'react-router';

import {api} from '../../api/client';
import BackToHome from '../../components/BackToHome/BackToHome';
import {PASSWORD_MIN_LENGTH} from '../../constants/common.const';
import {errorKey} from '../../i18n/errors';
import type {MessageKey} from '../../i18n/messages';
import {useI18n} from '../../i18n/useI18n';
import {WRONG_PASSWORD} from '../../mocks/handlers';
import {useSession} from '../../session/useSession';
import {usePaths} from '../../tenant/usePaths';
import {useTenant} from '../../tenant/useTenant';
import {isValidEmail} from '../../utils/formatters.utils';

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const {brandId, name} = useTenant();
  const {t, rich} = useI18n();
  const {page} = usePaths();
  const {signIn} = useSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [apiError, setApiError] = useState<MessageKey | null>(null);
  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting},
  } = useForm<LoginFormValues>({mode: 'onTouched'});

  // Only ever return to a page of this tenant.
  const next = searchParams.get('next');
  const destination = next?.startsWith(`/${brandId}/`) ? next : page('account');

  async function onSubmit(data: LoginFormValues) {
    setApiError(null);
    try {
      signIn(await api.signIn(brandId, data.email, data.password));
      await navigate(destination);
    } catch (error) {
      setApiError(errorKey(error));
    }
  }

  return (
    <div className="page">
      <h1 className="h1">{t('login.title', {name})}</h1>

      <p className="notice">
        {rich('login.demo', {min: PASSWORD_MIN_LENGTH, wrong: WRONG_PASSWORD, code: (chunks) => <code>{chunks}</code>})}
      </p>

      <form
        className="form"
        onSubmit={(event) => {
          void handleSubmit(onSubmit)(event);
        }}
        aria-busy={isSubmitting}
        noValidate
      >
        <Field label={t('login.email')} error={errors.email?.message}>
          {(control) => (
            <Input
              {...control}
              type="email"
              autoComplete="email"
              {...register('email', {
                required: t('login.emailRequired'),
                validate: (v) => isValidEmail(v) || t('login.emailInvalid'),
              })}
            />
          )}
        </Field>

        <Field label={t('login.password')} error={errors.password?.message}>
          {(control) => (
            <Input
              {...control}
              type="password"
              autoComplete="current-password"
              {...register('password', {
                required: t('login.passwordRequired'),
                minLength: {value: PASSWORD_MIN_LENGTH, message: t('login.passwordShort', {min: PASSWORD_MIN_LENGTH})},
              })}
            />
          )}
        </Field>

        {apiError && (
          <div className="error" role="alert">
            {t(apiError)}
          </div>
        )}

        <Button type="submit" loading={isSubmitting} fullWidth>
          {isSubmitting ? t('login.submitting') : t('login.submit')}
        </Button>

        <BackToHome />
      </form>
    </div>
  );
}

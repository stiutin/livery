import {Button, Field, Input} from '@livery/ui';
import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {useNavigate, useSearchParams} from 'react-router';

import {api} from '../../api/client';
import BackToHome from '../../components/BackToHome/BackToHome';
import {PASSWORD_MIN_LENGTH} from '../../constants/common.const';
import {WRONG_PASSWORD} from '../../mocks/handlers';
import {useSession} from '../../session/useSession';
import {useTenant} from '../../tenant/useTenant';
import {isValidEmail} from '../../utils/formatters.utils';

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const {brandId, name} = useTenant();
  const {signIn} = useSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting},
  } = useForm<LoginFormValues>({mode: 'onTouched'});

  // Only ever return to a page of this tenant.
  const next = searchParams.get('next');
  const destination = next?.startsWith(`/${brandId}/`) ? next : `/${brandId}/account`;

  async function onSubmit(data: LoginFormValues) {
    setApiError(null);
    try {
      signIn(await api.signIn(brandId, data.email, data.password));
      await navigate(destination);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Sign-in failed.');
    }
  }

  return (
    <div className="page">
      <h1 className="h1">Sign in to {name}</h1>

      <p className="notice">
        This is a demo with a mocked API: any email and a password of {PASSWORD_MIN_LENGTH} characters or more signs in.
        The password <code>{WRONG_PASSWORD}</code> is refused, and an email starting with <code>new</code> has no
        invoices.
      </p>

      <form
        className="form"
        onSubmit={(event) => {
          void handleSubmit(onSubmit)(event);
        }}
        aria-busy={isSubmitting}
        noValidate
      >
        <Field label="Email address" error={errors.email?.message}>
          {(control) => (
            <Input
              {...control}
              type="email"
              autoComplete="email"
              {...register('email', {
                required: 'Email is required',
                validate: (v) => isValidEmail(v) || 'Enter a valid email address',
              })}
            />
          )}
        </Field>

        <Field label="Password" error={errors.password?.message}>
          {(control) => (
            <Input
              {...control}
              type="password"
              autoComplete="current-password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: PASSWORD_MIN_LENGTH,
                  message: `Password must have at least ${PASSWORD_MIN_LENGTH} characters`,
                },
              })}
            />
          )}
        </Field>

        {apiError && (
          <div className="error" role="alert">
            {apiError}
          </div>
        )}

        <Button type="submit" loading={isSubmitting} fullWidth>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>

        <BackToHome />
      </form>
    </div>
  );
}

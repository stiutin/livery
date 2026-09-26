import {Button, Field, Input} from '@livery/ui';
import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {useNavigate} from 'react-router';

import BackToHome from '../../components/BackToHome/BackToHome';
import {PASSWORD_MIN_LENGTH} from '../../constants/common.const';
import {identityApi} from '../../services/identityApi';
import {useTenant} from '../../tenant/useTenant';
import type {LoginFormValues} from '../../types/loginForm';
import {isValidEmail} from '../../utils/formatters.utils';

export default function LoginPage() {
  const {brandId} = useTenant();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting},
  } = useForm<LoginFormValues>({mode: 'onTouched'});

  async function onSubmit(data: LoginFormValues) {
    setApiError(null);

    try {
      await identityApi.login({
        brandId,
        email: data.email,
        password: data.password,
      });
      await navigate(`/${brandId}/account/billing`);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Login unsuccessful.');
    }
  }

  return (
    <div className="page">
      <h1 className="h1">Login</h1>

      <p className="notice">
        Tenant-aware login for <strong>{brandId}</strong>
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
          {isSubmitting ? 'Processing…' : 'Login'}
        </Button>

        <BackToHome />
      </form>
    </div>
  );
}

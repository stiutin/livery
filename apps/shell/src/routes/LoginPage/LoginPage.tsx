import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { useTenant } from "../../tenant/useTenant";
import { useThemeComponents } from "../../theme/useThemeComponents";
import BackToHome from "../../components/BackToHome/BackToHome";
import { identityApi } from "../../services/identityApi";
import { isValidEmail } from "../../utils/formatters.utils";
import type { LoginFormValues } from "../../types/loginForm";
import { PASSWORD_MIN_LENGTH } from "../../constants/common.const";

export default function LoginPage() {
  const { brandId } = useTenant();
  const { BrandButton } = useThemeComponents();
  const navigate = useNavigate();
  const { search } = useLocation();
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ mode: "onTouched" });

  async function onSubmit(data: LoginFormValues) {
    setApiError(null);

    try {
      await identityApi.login({
        brandId,
        email: data.email,
        password: data.password,
      });
      navigate(`/account/billing${search}`);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Login unsuccessful.");
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
        onSubmit={handleSubmit(onSubmit)}
        aria-busy={isSubmitting}
        noValidate
      >
        <div className="field">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email", {
              required: "Email is required",
              validate: (v) => isValidEmail(v) || "Enter a valid email address",
            })}
          />
          {errors.email && (
            <span id="email-error" className="field-error" role="alert">
              {errors.email.message}
            </span>
          )}
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: PASSWORD_MIN_LENGTH,
                message: `Password must have at least ${PASSWORD_MIN_LENGTH} characters`,
              },
            })}
          />
          {errors.password && (
            <span id="password-error" className="field-error" role="alert">
              {errors.password.message}
            </span>
          )}
        </div>

        {apiError && (
          <div className="error" role="alert">
            {apiError}
          </div>
        )}

        <BrandButton
          type="submit"
          disabled={isSubmitting}
          style={{ width: "100%" }}
        >
          {isSubmitting ? "Processing…" : "Login"}
        </BrandButton>

        <BackToHome />
      </form>
    </div>
  );
}

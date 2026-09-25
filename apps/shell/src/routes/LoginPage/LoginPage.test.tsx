/* @vitest-environment jsdom */
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, afterEach, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./LoginPage";
import { TenantProvider } from "../../tenant/TenantContext";
import * as identityApiModule from "../../services/identityApi";

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={["/auth/login"]}>
      <TenantProvider>
        <Routes>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/account/billing" element={<div>Billing page</div>} />
        </Routes>
      </TenantProvider>
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  test("shows error when email is blank on submit", async () => {
    renderLoginPage();

    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
  });

  test("shows validation error for invalid email format", async () => {
    renderLoginPage();

    await userEvent.type(
      screen.getByLabelText(/email address/i),
      "not-an-email",
    );
    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
  });

  test("shows validation error when password is blank", async () => {
    renderLoginPage();

    await userEvent.type(
      screen.getByLabelText(/email address/i),
      "user@example.com",
    );
    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(
      await screen.findByText(/password is required/i),
    ).toBeInTheDocument();
  });

  test("shows validation error when password is too short", async () => {
    renderLoginPage();

    await userEvent.type(
      screen.getByLabelText(/email address/i),
      "user@example.com",
    );
    await userEvent.type(screen.getByLabelText(/password/i), "abc");
    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/6 characters/i);
  });

  test("calls identityApi.login with the typed credentials", async () => {
    const loginSpy = vi
      .spyOn(identityApiModule.identityApi, "login")
      .mockResolvedValue({ ok: true });

    renderLoginPage();

    await userEvent.type(
      screen.getByLabelText(/email address/i),
      "user@example.com",
    );
    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() =>
      expect(loginSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "user@example.com",
          password: "password123",
        }),
      ),
    );
  });

  test("navigates to billing page after successful login", async () => {
    vi.spyOn(identityApiModule.identityApi, "login").mockResolvedValue({
      ok: true,
    });

    renderLoginPage();

    await userEvent.type(
      screen.getByLabelText(/email address/i),
      "user@example.com",
    );
    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(await screen.findByText(/Billing page/i)).toBeInTheDocument();
  });

  test("shows API error message when login fails", async () => {
    vi.spyOn(identityApiModule.identityApi, "login").mockRejectedValue(
      new Error("Invalid credentials."),
    );

    renderLoginPage();

    await userEvent.type(
      screen.getByLabelText(/email address/i),
      "user@example.com",
    );
    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /invalid credentials/i,
    );
  });
});

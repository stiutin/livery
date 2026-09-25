/* @vitest-environment jsdom */
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, afterEach } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import HomePage from "./HomePage";
import { TenantProvider } from "../../tenant/TenantContext";

function HomePageWithLocation() {
  const location = useLocation();

  return (
    <>
      <HomePage />
      <div data-testid="location">
        {location.pathname}
        {location.search}
      </div>
    </>
  );
}

function renderHomePage(initialEntries = ["/"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <TenantProvider>
        <Routes>
          <Route path="/" element={<HomePageWithLocation />} />
          <Route path="/auth/login" element={<div>Login page</div>} />
          <Route path="/account/billing" element={<div>Billing page</div>} />
        </Routes>
      </TenantProvider>
    </MemoryRouter>,
  );
}

describe("HomePage", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders tenant settings and navigation buttons", () => {
    renderHomePage();

    expect(
      screen.getByRole("heading", { name: /welcome/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /tenant/i })).toHaveValue(
      "tenant-default",
    );
    expect(screen.getByRole("combobox", { name: /locale/i })).toHaveValue(
      "en-US",
    );
    expect(screen.getByRole("combobox", { name: /currency/i })).toHaveValue(
      "USD",
    );
    expect(
      screen.getByRole("button", { name: /go to login/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /go to billing/i }),
    ).toBeInTheDocument();
  });

  test("updates query string when tenant settings change", async () => {
    renderHomePage();

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: /tenant/i }),
      "tenant-alpha",
    );

    expect(screen.getByTestId("location")).toHaveTextContent(
      "/?brand=tenant-alpha",
    );

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: /locale/i }),
      "fr-FR",
    );

    expect(screen.getByTestId("location")).toHaveTextContent(
      "/?brand=tenant-alpha&locale=fr-FR",
    );

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: /currency/i }),
      "EUR",
    );

    expect(screen.getByTestId("location")).toHaveTextContent(
      "/?brand=tenant-alpha&locale=fr-FR&currency=EUR",
    );
  });

  test("navigates to login page and preserves query string", async () => {
    renderHomePage();

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: /tenant/i }),
      "tenant-alpha",
    );
    await userEvent.click(screen.getByRole("button", { name: /go to login/i }));

    expect(screen.getByText(/Login page/i)).toBeInTheDocument();
  });

  test("navigates to billing page and preserves query string", async () => {
    renderHomePage();

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: /tenant/i }),
      "tenant-alpha",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /go to billing/i }),
    );

    expect(screen.getByText(/Billing page/i)).toBeInTheDocument();
  });
});

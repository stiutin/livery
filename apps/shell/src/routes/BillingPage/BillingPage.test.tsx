import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { describe, test, expect, afterEach, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import BillingPage from "./BillingPage";
import { TenantProvider } from "../../tenant/TenantContext";
import * as billingApiModule from "../../services/billingApi";
import { MAX_AMOUNT } from "../../constants/common.const";

function renderBillingPage() {
  return render(
    <MemoryRouter initialEntries={["/account/billing"]}>
      <TenantProvider>
        <BillingPage />
      </TenantProvider>
    </MemoryRouter>,
  );
}

describe("BillingPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  test("shows validation error for invalid amount", async () => {
    renderBillingPage();

    const btn = screen.getByRole("button", { name: /create invoice/i });
    fireEvent.click(btn);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Enter a valid billing amount/i,
    );
  });

  test("submits and shows success when API returns invoice", async () => {
    vi.spyOn(billingApiModule.billingApi, "createInvoice").mockResolvedValue({
      invoiceId: "inv_test",
      amount: 42,
    });

    renderBillingPage();

    const input = screen.getByLabelText(/Billing amount/i);
    fireEvent.change(input, { target: { value: "42" } });

    const btn = screen.getByRole("button", { name: /create invoice/i });
    fireEvent.click(btn);

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/Invoice created/),
    );
  });

  test("shows validation error when amount exceeds maximum", async () => {
    renderBillingPage();

    const input = screen.getByLabelText(/Billing amount/i);
    fireEvent.change(input, { target: { value: String(MAX_AMOUNT + 1) } });

    const btn = screen.getByRole("button", { name: /create invoice/i });
    fireEvent.click(btn);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /must not exceed/i,
    );
  });

  test("shows error when billing API throws", async () => {
    vi.spyOn(billingApiModule.billingApi, "createInvoice").mockRejectedValue(
      new Error("Billing failed"),
    );

    renderBillingPage();

    const input = screen.getByLabelText(/Billing amount/i);
    fireEvent.change(input, { target: { value: "42" } });

    const btn = screen.getByRole("button", { name: /create invoice/i });
    fireEvent.click(btn);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /billing failed/i,
    );
  });

  test("shows empty state when API returns no invoice", async () => {
    vi.spyOn(billingApiModule.billingApi, "createInvoice").mockResolvedValue(
      null,
    );

    renderBillingPage();

    const input = screen.getByLabelText(/Billing amount/i);
    fireEvent.change(input, { target: { value: "42" } });

    const btn = screen.getByRole("button", { name: /create invoice/i });
    fireEvent.click(btn);

    expect(await screen.findByRole("status")).toHaveTextContent(
      /No invoice generated for this tenant/i,
    );
  });

  test("resets to form state after success and allows another invoice", async () => {
    vi.spyOn(billingApiModule.billingApi, "createInvoice").mockResolvedValue({
      invoiceId: "inv_test",
      amount: 42,
    });

    renderBillingPage();

    const input = screen.getByLabelText(/Billing amount/i);
    fireEvent.change(input, { target: { value: "42" } });

    const btn = screen.getByRole("button", { name: /create invoice/i });
    fireEvent.click(btn);

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/Invoice created/),
    );

    fireEvent.click(
      screen.getByRole("button", { name: /create another invoice/i }),
    );

    expect(screen.getByLabelText(/Billing amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Billing amount/i)).toHaveValue("");
  });
});

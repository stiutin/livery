import { MAX_AMOUNT } from "../constants/common.const"

export type CreateInvoiceInput = {
  brandId: string
  amount: number
  currency: string
}

export type CreateInvoiceResult = { invoiceId: string; amount: number }

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export const billingApi = {
  async createInvoice(input: CreateInvoiceInput): Promise<CreateInvoiceResult | null> {
    await delay(800)

    // Mock behavior: for one brand, return empty.
    if (input.brandId === 'tenant-empty') return null

    if (input.amount > MAX_AMOUNT) {
      throw new Error('Billing amount exceeds mock approval limit.')
    }

    const invoiceId = `inv_${input.brandId}_${Math.floor(input.amount * 100)}_${Date.now()}`
    return { invoiceId, amount: input.amount }
  }
}


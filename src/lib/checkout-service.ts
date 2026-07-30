import { checkoutRepository } from "@/lib/checkout-repository";
import { convertDisplayAmountToSats } from "@/lib/fx";
import { lndClient } from "@/lib/lnd";
import {
  Checkout,
  CheckoutStatus,
  CreateCheckoutInput,
  PricingCurrency,
} from "@/types/checkout";

const DEFAULT_EXPIRY_SECONDS = 3600;
const DEFAULT_INVOICE_MEMO = "Lightning Merchant Checkout";

const normalizeOptionalText = (value?: string | null) => {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : null;
};

const validateDisplayCurrency = (
  displayCurrency?: PricingCurrency
): PricingCurrency => displayCurrency ?? "ETB";

const validateExpirySeconds = (expirySeconds?: number) => {
  if (expirySeconds === undefined) {
    return DEFAULT_EXPIRY_SECONDS;
  }

  if (!Number.isInteger(expirySeconds) || expirySeconds <= 0) {
    throw new Error("expirySeconds must be a positive integer");
  }

  return expirySeconds;
};

const buildInvoiceMemo = (
  memo: string | null,
  merchantRef: string | null
): string => {
  if (memo && merchantRef) {
    return `${memo} [${merchantRef}]`;
  }

  return memo || merchantRef || DEFAULT_INVOICE_MEMO;
};

const derivePaidAt = (settleDate?: string) => {
  if (!settleDate) {
    return null;
  }

  const settledAtSeconds = Number(settleDate);
  if (!Number.isFinite(settledAtSeconds) || settledAtSeconds <= 0) {
    return null;
  }

  return new Date(settledAtSeconds * 1000).toISOString();
};

const deriveSettlementMs = (createdAt: string, paidAt: string | null) => {
  if (!paidAt) {
    return null;
  }

  const createdAtMs = new Date(createdAt).getTime();
  const paidAtMs = new Date(paidAt).getTime();

  if (Number.isNaN(createdAtMs) || Number.isNaN(paidAtMs)) {
    return null;
  }

  const settlementMs = paidAtMs - createdAtMs;
  return settlementMs >= 0 ? settlementMs : null;
};

const hasExpired = (checkout: Checkout) =>
  checkout.status === "pending" && new Date(checkout.expiresAt).getTime() <= Date.now();

const isInvoicePaid = (state?: string, settled?: boolean) =>
  state === "SETTLED" || settled === true;

export class CheckoutService {
  async createCheckout(input: CreateCheckoutInput): Promise<Checkout> {
    if (!Number.isFinite(input.displayAmount) || input.displayAmount <= 0) {
      throw new Error("displayAmount must be a positive number");
    }

    const displayCurrency = validateDisplayCurrency(input.displayCurrency);
    const expirySeconds = validateExpirySeconds(input.expirySeconds);
    const memo = normalizeOptionalText(input.memo);
    const merchantRef = normalizeOptionalText(input.merchantRef);
    const invoiceMemo = buildInvoiceMemo(memo, merchantRef);

    const conversion = await convertDisplayAmountToSats(
      input.displayAmount,
      displayCurrency
    );
    const invoice = await lndClient.createInvoice(
      conversion.amountSats,
      invoiceMemo,
      expirySeconds
    );

    return checkoutRepository.createCheckout({
      amountSats: conversion.amountSats,
      displayCurrency,
      displayAmount: conversion.normalizedDisplayAmount,
      btcEtbRate: conversion.quote.btcEtbRate,
      rateSource: conversion.quote.source,
      memo,
      merchantRef,
      status: "pending",
      paymentRequest: invoice.payment_request,
      rHash: invoice.r_hash.toString("hex"),
      paymentAddr: invoice.payment_addr.toString("hex"),
      expiresAt: new Date(Date.now() + expirySeconds * 1000).toISOString(),
    });
  }

  async getCheckoutById(id: string): Promise<Checkout | null> {
    const checkout = await checkoutRepository.getCheckoutById(id);

    if (!checkout || !hasExpired(checkout)) {
      return checkout;
    }

    return checkoutRepository.updateCheckoutStatus({
      id: checkout.id,
      status: "expired",
    });
  }

  async getCheckoutByRHash(rHash: string): Promise<Checkout | null> {
    return checkoutRepository.getCheckoutByRHash(rHash);
  }

  async listRecentCheckouts(limit = 10): Promise<Checkout[]> {
    return checkoutRepository.listRecentCheckouts(limit);
  }

  async refreshCheckoutStatus(id: string): Promise<Checkout | null> {
    const checkout = await checkoutRepository.getCheckoutById(id);

    if (!checkout) {
      return null;
    }

    if (checkout.status === "paid") {
      return checkout;
    }

    const invoice = await lndClient.checkInvoiceStatus(Buffer.from(checkout.rHash, "hex"));

    if (isInvoicePaid(invoice.state, invoice.settled)) {
      const paidAt = derivePaidAt(invoice.settle_date) || new Date().toISOString();
      const settlementMs = deriveSettlementMs(checkout.createdAt, paidAt);

      return checkoutRepository.updateCheckoutStatus({
        id: checkout.id,
        status: "paid",
        paidAt,
        settlementMs,
      });
    }

    const nextStatus: CheckoutStatus = hasExpired(checkout) ? "expired" : checkout.status;

    if (nextStatus === checkout.status) {
      return checkout;
    }

    return checkoutRepository.updateCheckoutStatus({
      id: checkout.id,
      status: nextStatus,
    });
  }
}

export const checkoutService = new CheckoutService();

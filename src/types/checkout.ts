export const checkoutStatuses = ["pending", "paid", "expired"] as const;

export type CheckoutStatus = (typeof checkoutStatuses)[number];
export type PricingCurrency = "ETB" | "SAT";

export interface CheckoutRecord {
  id: string;
  amount_sats: number;
  display_currency: PricingCurrency;
  display_amount: number;
  btc_etb_rate: number;
  rate_source: string;
  memo: string | null;
  merchant_ref: string | null;
  status: CheckoutStatus;
  payment_request: string;
  r_hash: string;
  payment_addr: string | null;
  expires_at: string;
  paid_at: string | null;
  settlement_ms: number | null;
  created_at: string;
  updated_at: string;
}

export interface Checkout {
  id: string;
  amountSats: number;
  displayCurrency: PricingCurrency;
  displayAmount: number;
  btcEtbRate: number;
  rateSource: string;
  memo: string | null;
  merchantRef: string | null;
  status: CheckoutStatus;
  paymentRequest: string;
  rHash: string;
  paymentAddr: string | null;
  expiresAt: string;
  paidAt: string | null;
  settlementMs: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeRateQuote {
  btcEtbRate: number;
  satsPerEtb: number;
  source: "coinbase" | "manual";
  fetchedAt: string;
}

export interface CreateCheckoutInput {
  displayAmount: number;
  displayCurrency?: PricingCurrency;
  memo?: string | null;
  merchantRef?: string | null;
  expirySeconds?: number;
}

export interface CreateCheckoutRecordInput {
  amountSats: number;
  displayCurrency: PricingCurrency;
  displayAmount: number;
  btcEtbRate: number;
  rateSource: string;
  memo?: string | null;
  merchantRef?: string | null;
  status?: CheckoutStatus;
  paymentRequest: string;
  rHash: string;
  paymentAddr?: string | null;
  expiresAt: string;
  paidAt?: string | null;
  settlementMs?: number | null;
}

export interface UpdateCheckoutStatusInput {
  id: string;
  status: CheckoutStatus;
  paidAt?: string | null;
  settlementMs?: number | null;
}

export const mapCheckoutRecord = (record: CheckoutRecord): Checkout => ({
  id: record.id,
  amountSats: record.amount_sats,
  displayCurrency: record.display_currency,
  displayAmount: record.display_amount,
  btcEtbRate: record.btc_etb_rate,
  rateSource: record.rate_source,
  memo: record.memo,
  merchantRef: record.merchant_ref,
  status: record.status,
  paymentRequest: record.payment_request,
  rHash: record.r_hash,
  paymentAddr: record.payment_addr,
  expiresAt: record.expires_at,
  paidAt: record.paid_at,
  settlementMs: record.settlement_ms,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

import {
  Checkout,
  CheckoutRecord,
  CreateCheckoutRecordInput,
  UpdateCheckoutStatusInput,
  mapCheckoutRecord,
} from "@/types/checkout";
import { createSupabaseServerClient } from "@/lib/supabase";

const CHECKOUT_TABLE = "checkouts";

const buildInsertPayload = (
  input: CreateCheckoutRecordInput
): Omit<CheckoutRecord, "id" | "created_at" | "updated_at"> => ({
  amount_sats: input.amountSats,
  display_currency: input.displayCurrency,
  display_amount: input.displayAmount,
  btc_etb_rate: input.btcEtbRate,
  rate_source: input.rateSource,
  memo: input.memo ?? null,
  merchant_ref: input.merchantRef ?? null,
  status: input.status ?? "pending",
  payment_request: input.paymentRequest,
  r_hash: input.rHash,
  payment_addr: input.paymentAddr ?? null,
  expires_at: input.expiresAt,
  paid_at: input.paidAt ?? null,
  settlement_ms: input.settlementMs ?? null,
});

export class CheckoutRepository {
  private readonly supabase = createSupabaseServerClient();

  async createCheckout(input: CreateCheckoutRecordInput): Promise<Checkout> {
    const { data, error } = await this.supabase
      .from(CHECKOUT_TABLE)
      .insert(buildInsertPayload(input))
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create checkout: ${error.message}`);
    }

    return mapCheckoutRecord(data as CheckoutRecord);
  }

  async getCheckoutById(id: string): Promise<Checkout | null> {
    const { data, error } = await this.supabase
      .from(CHECKOUT_TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch checkout ${id}: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return mapCheckoutRecord(data as CheckoutRecord);
  }

  async getCheckoutByRHash(rHash: string): Promise<Checkout | null> {
    const { data, error } = await this.supabase
      .from(CHECKOUT_TABLE)
      .select("*")
      .eq("r_hash", rHash)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch checkout by r_hash: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return mapCheckoutRecord(data as CheckoutRecord);
  }

  async listRecentCheckouts(limit = 10): Promise<Checkout[]> {
    const { data, error } = await this.supabase
      .from(CHECKOUT_TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to list recent checkouts: ${error.message}`);
    }

    return (data as CheckoutRecord[]).map(mapCheckoutRecord);
  }

  async updateCheckoutStatus(
    input: UpdateCheckoutStatusInput
  ): Promise<Checkout | null> {
    const payload: Partial<CheckoutRecord> = {
      status: input.status,
      paid_at: input.paidAt ?? null,
      settlement_ms: input.settlementMs ?? null,
    };

    const { data, error } = await this.supabase
      .from(CHECKOUT_TABLE)
      .update(payload)
      .eq("id", input.id)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new Error(
        `Failed to update checkout status for ${input.id}: ${error.message}`
      );
    }

    if (!data) {
      return null;
    }

    return mapCheckoutRecord(data as CheckoutRecord);
  }
}

export const checkoutRepository = new CheckoutRepository();

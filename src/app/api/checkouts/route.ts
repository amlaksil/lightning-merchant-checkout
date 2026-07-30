import { NextRequest, NextResponse } from "next/server";

import { checkoutService } from "@/lib/checkout-service";
import { CreateCheckoutInput, PricingCurrency } from "@/types/checkout";

const isPricingCurrency = (
  value: string | null | undefined
): value is PricingCurrency => value === "ETB" || value === "SAT";

const normalizeCreateCheckoutInput = (
  body: Partial<CreateCheckoutInput>
): CreateCheckoutInput => {
  if (!Number.isFinite(body.displayAmount) || Number(body.displayAmount) <= 0) {
    throw new Error("displayAmount must be a positive number");
  }

  if (
    body.displayCurrency !== undefined &&
    !isPricingCurrency(body.displayCurrency)
  ) {
    throw new Error("displayCurrency must be ETB or SAT");
  }

  if (
    body.expirySeconds !== undefined &&
    (!Number.isInteger(body.expirySeconds) || body.expirySeconds <= 0)
  ) {
    throw new Error("expirySeconds must be a positive integer");
  }

  return {
    displayAmount: Number(body.displayAmount),
    displayCurrency: body.displayCurrency ?? "ETB",
    memo: body.memo,
    merchantRef: body.merchantRef,
    expirySeconds: body.expirySeconds,
  };
};

const normalizeListLimit = (value: string | null) => {
  if (!value) {
    return 10;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("limit must be a positive integer");
  }

  return Math.min(parsed, 50);
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<CreateCheckoutInput>;
    const input = normalizeCreateCheckoutInput(body);
    const checkout = await checkoutService.createCheckout(input);

    return NextResponse.json(checkout, { status: 201 });
  } catch (error) {
    const message = getErrorMessage(error, "Failed to create checkout");
    const status =
      message.includes("must be") || message.includes("displayCurrency")
        ? 400
        : 500;

    console.error("Error creating checkout:", error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(request: NextRequest) {
  try {
    const limit = normalizeListLimit(request.nextUrl.searchParams.get("limit"));
    const checkouts = await checkoutService.listRecentCheckouts(limit);

    return NextResponse.json({ items: checkouts });
  } catch (error) {
    const message = getErrorMessage(error, "Failed to list checkouts");
    const status = message.includes("limit") ? 400 : 500;

    console.error("Error listing checkouts:", error);
    return NextResponse.json({ error: message }, { status });
  }
}

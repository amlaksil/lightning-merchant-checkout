import { NextRequest, NextResponse } from "next/server";

import { checkoutService } from "@/lib/checkout-service";

interface RouteParams {
  id: string;
}

export async function POST(
  _request: NextRequest,
  props: { params: Promise<RouteParams> }
): Promise<Response> {
  const params = await props.params;
  const { id } = params;

  if (!id) {
    return NextResponse.json(
      { error: "Missing checkout id parameter" },
      { status: 400 }
    );
  }

  try {
    const checkout = await checkoutService.refreshCheckoutStatus(id);

    if (!checkout) {
      return NextResponse.json({ error: "Checkout not found" }, { status: 404 });
    }

    return NextResponse.json(checkout);
  } catch (error) {
    console.error(`Error refreshing checkout ${id}:`, error);
    return NextResponse.json(
      { error: "Failed to refresh checkout status" },
      { status: 500 }
    );
  }
}

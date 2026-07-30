import { NextRequest, NextResponse } from "next/server";
import { lndClient } from "@/lib/lnd";
import { InvoiceRequest, FrontendInvoice } from "@/types/lnd";

export async function POST(request: NextRequest) {
  try {
    const body: InvoiceRequest = await request.json();

    if (!body.amount || !body.memo) {
      return NextResponse.json(
        { error: "Amount and memo are required" },
        { status: 400 }
      );
    }

    console.log("Creating invoice...", {
      amount: body.amount,
      memo: body.memo,
      expiry: body.expiry,
    });

    // Create the invoice using our lnd client
    const lndInvoice = await lndClient.createInvoice(
      body.amount,
      body.memo,
      body.expiry
    );
    console.log("Invoice created:", { lndInvoice });

    // Transform the response to match our frontend types
    const invoice: FrontendInvoice = {
      paymentRequest: lndInvoice.payment_request,
      amount: body.amount,
      memo: body.memo,
      expiry: body.expiry || 3600,
      rHash: lndInvoice.r_hash.toString("hex"),
      paymentAddr: lndInvoice.payment_addr.toString("hex"),
      isPaid: false,
    };

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}

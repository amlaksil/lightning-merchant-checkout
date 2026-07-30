import { NextRequest } from "next/server";
import { lndClient } from "@/lib/lnd";
import { PaymentStatus } from "@/types/lnd";

interface RouteParams {
  rHash: string;
}

export async function GET(request: NextRequest, props: { params: Promise<RouteParams> }): Promise<Response> {
  const params = await props.params;
  const { rHash } = params;

  if (!rHash) {
    return Response.json(
      { error: "Missing rHash parameter" },
      { status: 400 }
    );
  }

  try {
    // Convert hex string back to Buffer
    const rHashBuffer = Buffer.from(rHash, "hex");

    // Check invoice status
    const invoice = await lndClient.checkInvoiceStatus(rHashBuffer);

    const response: PaymentStatus = {
      isPaid: invoice.state === "SETTLED" || invoice.settled === true,
    };

    return Response.json(response);
  } catch (error) {
    console.error("Error checking invoice status:", error);
    return Response.json(
      { error: "Failed to check invoice status" },
      { status: 500 }
    );
  }
} 
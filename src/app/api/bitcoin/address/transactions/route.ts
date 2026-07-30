import { NextRequest } from "next/server";
import { BitcoinCLI } from "@/lib/bitcoin-cli";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const txids = searchParams.get("txids")?.split(",") || [];
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

  if (txids.length === 0) {
    return Response.json({ transactions: [], total: 0 });
  }

  try {
    const bitcoin = new BitcoinCLI();
    const result = await bitcoin.getAddressTransactions(txids, page, pageSize);
    return Response.json(result);
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return Response.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
} 
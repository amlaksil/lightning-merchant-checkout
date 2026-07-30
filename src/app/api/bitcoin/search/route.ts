import { NextRequest } from "next/server";
import { BitcoinCLI } from "@/lib/bitcoin-cli";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query) {
    return Response.json({ results: [] });
  }

  const bitcoin = new BitcoinCLI();

  try {
    // Try to parse as block height first
    if (/^\d+$/.test(query)) {
      try {
        const hash = await bitcoin.getBlockHash(parseInt(query, 10));
        const block = await bitcoin.getBlock(hash, 2);
        return Response.json({
          results: [{ type: "block", data: block }],
        });
      } catch {
        // Not a valid block height, continue to other checks
      }
    }

    // Check if it's a block hash
    if (/^[0-9a-fA-F]{64}$/.test(query)) {
      try {
        const block = await bitcoin.getBlock(query, 2);
        return Response.json({
          results: [{ type: "block", data: block }],
        });
      } catch {
        // Not a block hash, try as transaction ID
        try {
          const tx = await bitcoin.getRawTransaction(query, 1);
          return Response.json({
            results: [{ type: "transaction", data: tx }],
          });
        } catch {
          // Not a transaction ID either
        }
      }
    }

    // Check if it's a valid address
    try {
      const addressInfo = await bitcoin.getAddressOverview(query);
      if (addressInfo.isvalid) {
        return Response.json({
          results: [{ type: "address", data: addressInfo }],
        });
      }
    } catch {
      // Not a valid address
    }

    // No results found
    return Response.json({ results: [] });
  } catch (error) {
    console.error("Search error:", error);
    return Response.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
} 
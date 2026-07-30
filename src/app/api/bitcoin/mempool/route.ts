import { NextResponse } from "next/server";

import BitcoinCLI from "@/lib/bitcoin-cli";
import { MempoolEntry } from "@/types/bitcoin-cli";

const bitcoin = new BitcoinCLI();

export async function GET() {
  try {
    const [mempoolInfo, rawMempool] = await Promise.all([
      bitcoin.getMempoolInfo(),
      bitcoin.getRawMempool(true),
    ]);

    // Calculate fee rates from mempool entries
    const feeRates = Object.values(rawMempool as Record<string, MempoolEntry>)
      .map((tx) => (tx.fees.base * 100000000) / tx.size) // Convert to sats/vB
      .sort((a, b) => a - b);

    const getFeePercentile = (percentile: number) => {
      const index = Math.floor((feeRates.length - 1) * (percentile / 100));
      return feeRates[index] || 0;
    };

    return NextResponse.json({
      info: mempoolInfo,
      feeEstimates: {
        low: getFeePercentile(10), // 10th percentile
        medium: getFeePercentile(50), // 50th percentile
        high: getFeePercentile(80), // 80th percentile
        urgent: getFeePercentile(90), // 90th percentile
      },
      transactions: Object.keys(rawMempool).length,
    });
  } catch (error) {
    console.error("Error fetching mempool:", error);
    return NextResponse.json(
      {
        status: "error",
        error: "Failed to fetch mempool data",
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import BitcoinCLI from "@/lib/bitcoin-cli";

const bitcoin = new BitcoinCLI();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ txid: string }> }
) {
  try {
    const { txid } = await params;

    // Get transaction with verbosity=1 for decoded transaction data
    const tx = await bitcoin.getRawTransaction(txid, 1);

    // If transaction is in mempool, get additional mempool info
    let mempoolInfo = null;
    if (!tx.blockhash) {
      try {
        mempoolInfo = await bitcoin.getMempoolEntry(txid);
      } catch {
        // Transaction might not be in mempool anymore, ignore error
        console.error(
          "Transaction might not be in mempool anymore, ignoring error"
        );
      }
    }

    return NextResponse.json({
      status: "success",
      data: {
        transaction: tx,
        mempoolInfo,
      },
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      {
        status: "error",
        error: "Failed to fetch transaction",
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import BitcoinCLI from "@/lib/bitcoin-cli";
import { BlockInfo } from "@/types/bitcoin-cli";

interface Block extends Omit<BlockInfo, "tx"> {
  tx: string[]; // When verbosity=1, tx is an array of strings
}

const bitcoin = new BitcoinCLI();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 10); // Cap at 10 blocks
    const start = parseInt(searchParams.get("start") || "0");

    // Get the current block count
    const blockCount = await bitcoin.getBlockCount();

    // Calculate the range of blocks to fetch
    const startHeight = Math.max(0, blockCount - start);
    const endHeight = Math.max(0, startHeight - limit);

    // Fetch blocks in parallel with reduced verbosity
    const blocks = await Promise.all(
      Array.from({ length: startHeight - endHeight }, async (_, i) => {
        const height = startHeight - i;
        const hash = await bitcoin.getBlockHash(height);

        // Get block with verbosity 1 (includes txids)
        const block = (await bitcoin.getBlock(hash, 1)) as unknown as Block;

        // Get only essential block stats
        const stats = await bitcoin.getBlockStats(height);

        // Since we're using verbosity=1, block.tx is already an array of txids
        const txids = block.tx;

        // Fetch basic details for each transaction in parallel
        // Limit to first 50 transactions to prevent overload
        const txDetails = await Promise.all(
          txids.slice(0, 50).map(async (txid) => {
            try {
              const tx = await bitcoin.getRawTransaction(txid, 1);
              // Ensure vout is an array before reducing
              const vout = Array.isArray(tx.vout) ? tx.vout : [];
              const totalOutput = vout.reduce(
                (sum, output) => sum + (output.value || 0),
                0
              );

              return {
                txid: tx.txid,
                hash: tx.hash,
                size: tx.size,
                vsize: tx.vsize,
                weight: tx.weight,
                vin: tx.vin,
                vout: tx.vout,
                totalOutput,
              };
            } catch (error) {
              console.error(`Error fetching transaction ${txid}:`, error);
              return {
                txid,
                error: "Failed to fetch transaction details",
              };
            }
          })
        );

        // Return only the necessary data
        return {
          height,
          hash: block.hash,
          time: block.time,
          size: block.size,
          weight: block.weight,
          difficulty: block.difficulty,
          tx: txDetails,
          txCount: block.tx.length,
          stats: {
            totalfee: stats.totalfee || 0,
          },
        };
      })
    );

    return NextResponse.json(blocks);
  } catch (error) {
    console.error("Error fetching blocks:", error);
    return NextResponse.json(
      { error: "Failed to fetch blocks" },
      { status: 500 }
    );
  }
}

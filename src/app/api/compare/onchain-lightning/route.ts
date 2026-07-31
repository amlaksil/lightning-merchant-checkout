import { NextRequest, NextResponse } from "next/server";

import BitcoinCLI from "@/lib/bitcoin-cli";
import type { TransactionInfo } from "@/types/bitcoin-cli";

const bitcoin = new BitcoinCLI();
const SEARCH_DEPTH = 25;

interface BlockWithTxids {
  hash: string;
  height: number;
  time: number;
  tx: string[];
}

const sumTransactionOutputs = (transaction: TransactionInfo) =>
  transaction.vout.reduce((sum, output) => sum + output.value, 0);

const findConfirmedTransaction = async (txid: string, tipHeight: number) => {
  const minHeight = Math.max(0, tipHeight - SEARCH_DEPTH + 1);

  for (let height = tipHeight; height >= minHeight; height -= 1) {
    const blockHash = await bitcoin.getBlockHash(height);
    const block = (await bitcoin.getBlock(blockHash, 1)) as unknown as BlockWithTxids;

    if (!block.tx.includes(txid)) {
      continue;
    }

    const transaction = await bitcoin.getRawTransaction(txid, 1, blockHash);

    return {
      status: "confirmed" as const,
      confirmations: tipHeight - height + 1,
      blockHeight: height,
      blockHash,
      blockTime: new Date(block.time * 1000).toISOString(),
      totalOutput: sumTransactionOutputs(transaction),
    };
  }

  return null;
};

const findOnchainTransaction = async (txid: string, tipHeight: number) => {
  const rawMempool = (await bitcoin.getRawMempool(false)) as string[];

  if (rawMempool.includes(txid)) {
    const mempoolEntry = await bitcoin.getMempoolEntry(txid);

    return {
      status: "mempool" as const,
      confirmations: 0,
      fee: mempoolEntry.fees.base,
      vsize: mempoolEntry.size,
      firstSeenTime: new Date(mempoolEntry.time * 1000).toISOString(),
    };
  }

  return findConfirmedTransaction(txid, tipHeight);
};

export async function GET(request: NextRequest) {
  try {
    const txid = request.nextUrl.searchParams.get("txid")?.trim();

    const [blockchainInfo, mempoolInfo, tipHeight, bestBlockHash] = await Promise.all([
      bitcoin.getBlockchainInfo(),
      bitcoin.getMempoolInfo(),
      bitcoin.getBlockCount(),
      bitcoin.getBestBlockHash(),
    ]);

    const bestBlock = (await bitcoin.getBlock(bestBlockHash, 1)) as unknown as BlockWithTxids;

    let transaction: null | {
      txid: string;
      status: "mempool" | "confirmed" | "unknown";
      confirmations: number;
      blockHeight?: number;
      blockHash?: string;
      blockTime?: string;
      totalOutput?: number;
      fee?: number;
      vsize?: number;
      firstSeenTime?: string;
    } = null;

    if (txid) {
      const onchainTransaction = await findOnchainTransaction(txid, tipHeight);

      transaction =
        onchainTransaction ?? {
          txid,
          status: "unknown",
          confirmations: 0,
        };

      if (transaction.status !== "unknown") {
        transaction = {
          txid,
          ...transaction,
        };
      }
    }

    return NextResponse.json({
      chain: {
        network: blockchainInfo.chain,
        tipHeight,
        bestBlockHash,
        bestBlockTime: new Date(bestBlock.time * 1000).toISOString(),
        mempoolSize: mempoolInfo.size,
        mempoolBytes: mempoolInfo.bytes,
        difficulty: blockchainInfo.difficulty,
        searchDepth: SEARCH_DEPTH,
      },
      transaction,
    });
  } catch (error) {
    console.error("Error building on-chain vs Lightning comparison:", error);
    return NextResponse.json(
      { error: "Failed to load comparison data" },
      { status: 500 }
    );
  }
}

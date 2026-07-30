import { NextResponse } from "next/server";
import BitcoinCLI from "@/lib/bitcoin-cli";

const bitcoin = new BitcoinCLI();

export async function GET() {
  try {
    const [networkInfo, blockCount, difficulty, chainTips] = await Promise.all([
      bitcoin.getNetworkInfo(),
      bitcoin.getBlockCount(),
      bitcoin.getDifficulty(),
      bitcoin.getChainTips(),
    ]);

    // Get the best block hash and its details
    const bestBlockHash = await bitcoin.getBestBlockHash();
    const bestBlock = await bitcoin.getBlock(bestBlockHash);

    return NextResponse.json({
      networks: networkInfo.networks,
      version: networkInfo.version,
      protocolVersion: networkInfo.protocolversion,
      blocks: blockCount,
      bestBlockHash,
      bestBlockHeight: bestBlock.height,
      bestBlockTime: bestBlock.time,
      difficulty,
      connections: networkInfo.connections,
      chainTips: chainTips.map(tip => ({
        height: tip.height,
        hash: tip.hash,
        branchLen: tip.branchlen,
        status: tip.status,
      })),
    });
  } catch (error) {
    console.error("Error fetching blockchain info:", error);
    return NextResponse.json(
      { error: "Failed to fetch blockchain info" },
      { status: 500 }
    );
  }
}

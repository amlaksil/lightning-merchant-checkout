import { NextResponse } from 'next/server';
import { bitcoin } from '@/lib/bitcoin';

export async function GET() {
  try {
    const [blockCount, blockHash, block] = await Promise.all([
      bitcoin.getBlockCount(),
      bitcoin.getBlockHash(0), // Get genesis block hash
      bitcoin.getBlock(await bitcoin.getBlockHash(0), 2) // Get detailed block info
    ]);

    console.log({block});

    return NextResponse.json({
      status: 'success',
      data: {
        height: blockCount,
        genesisBlock: {
          hash: blockHash,
          details: block
        }
      }
    });
  } catch (error) {
    console.error('Error fetching blockchain info:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch blockchain info'
      },
      { status: 500 }
    );
  }
} 
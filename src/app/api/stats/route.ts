export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { blockchainService } from '@/lib/blockchain';
import { Block } from '@/models/Block';

export async function GET() {
  try {
    await dbConnect();
    const totalBlocks = await Block.countDocuments();
    const latestBlock = await blockchainService.getLatestBlock();
    const totalTransactions = await blockchainService.getTotalTransactions();

    return NextResponse.json({
      totalBlocks,
      latestBlockNumber: latestBlock?.index || 0,
      totalTransactions,
      blockchainHeight: totalBlocks,
      latestBlockIndex: latestBlock?.index || 0,
      latestBlockHash: latestBlock?.hash || '0',
    }, { status: 200 });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

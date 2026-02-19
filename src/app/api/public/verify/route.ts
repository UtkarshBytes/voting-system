import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Vote } from '@/models/Vote';
import { Election } from '@/models/Election';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const voteId = searchParams.get('voteId');

    if (!voteId) {
      return NextResponse.json({ error: 'Vote ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Find the vote by voteCode (receipt ID)
    const vote = await Vote.findOne({ voteCode: voteId }).populate('electionId', 'title');

    if (!vote) {
      return NextResponse.json({ valid: false }, { status: 200 }); // Return 200 OK with valid: false as per spec
    }

    // Extract election title safely
    const electionTitle = (vote.electionId as any)?.title || 'Unknown Election';

    return NextResponse.json({
      valid: true,
      electionTitle,
      timestamp: vote.timestamp,
      blockNumber: vote.blockNumber,
      blockchainHash: vote.transactionHash
    });

  } catch (error) {
    console.error('Public verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

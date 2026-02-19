export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Vote } from '@/models/Vote';
import { Block } from '@/models/Block';
import { Election } from '@/models/Election';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const txHash = searchParams.get('txHash');
    const code = searchParams.get('code');

    if (!txHash && !code) {
      return NextResponse.json({ error: 'Transaction hash or verification code is required' }, { status: 400 });
    }

    await dbConnect();

    let vote = null;

    if (txHash) {
        vote = await Vote.findOne({ transactionHash: txHash });
    } else if (code) {
        vote = await Vote.findOne({ voteCode: code });
    }

    if (!vote) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Get block info
    const block = await Block.findOne({ index: vote.blockNumber });

    // Get election info
    const election = await Election.findById(vote.electionId);

    // Get candidate info
    const candidate = election?.candidates.find((c: any) => c.id === vote!.candidateId);

    return NextResponse.json({
      valid: true,
      transaction: {
        id: vote.transactionHash,
        voterId: 'HIDDEN',
        candidateId: vote.candidateId,
        electionId: vote.electionId.toString(),
        timestamp: vote.timestamp,
        voteVerificationCode: vote.voteCode
      },
      block: {
        index: block?.index || vote.blockNumber,
        hash: block?.hash || 'UNKNOWN',
      },
      election: {
        id: election?._id.toString(),
        title: election?.title,
      },
      candidate: {
        id: candidate?.id,
        name: candidate?.name,
        party: candidate?.party,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

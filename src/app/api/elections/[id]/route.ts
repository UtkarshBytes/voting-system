export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { blockchainService } from '@/lib/blockchain';
import { Election } from '@/models/Election';
import { Candidate } from '@/models/Candidate';
import { User } from '@/models/User';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await dbConnect();

    // Validate ObjectId? Mongoose usually handles strings but catches error if invalid
    // Better to try/catch
    let election;
    try {
        election = await Election.findById(id);
    } catch {
        return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    if (!election) {
      return NextResponse.json({ error: 'Election not found' }, { status: 404 });
    }

    // Fetch Candidates for this election
    const candidates = await Candidate.find({ electionId: id }).populate('partyId', 'name');

    // Map candidates to match expected frontend structure if needed, or update frontend
    const candidatesData = candidates.map(c => ({
        id: c._id.toString(),
        name: c.name,
        party: (c.partyId as any)?.name || 'Independent',
        imageUrl: c.imageUrl
    }));

    const results = await blockchainService.getVoteCounts(id);
    const totalVotes = await blockchainService.getTotalVotes(id);
    const lastBlock = await blockchainService.getLatestBlock();
    const totalVoters = await User.countDocuments({ role: 'USER' });

    return NextResponse.json({
      election: {
          ...election.toObject(),
          id: election._id.toString(),
          candidates: candidatesData
      },
      results,
      stats: {
        totalVotes,
        turnout: totalVoters > 0 ? (totalVotes / totalVoters) * 100 : 0,
        lastBlockIndex: lastBlock?.index || 0,
        lastBlockHash: lastBlock?.hash || '0',
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Get election error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

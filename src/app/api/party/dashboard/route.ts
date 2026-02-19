export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import { User } from '@/models/User';
import { Party } from '@/models/Party';
import { Candidate } from '@/models/Candidate';
import { Election } from '@/models/Election';
import { Vote } from '@/models/Vote';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(session.id);
    if (!user || user.role !== 'PARTY_LEADER') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!user.partyId) {
        return NextResponse.json({ error: 'No party assigned' }, { status: 400 });
    }

    const party = await Party.findById(user.partyId);

    // 1. Total Members
    const totalMembers = await User.countDocuments({ partyId: user.partyId });

    // 2. Candidates in each election
    const candidates = await Candidate.find({ partyId: user.partyId }).populate('electionId', 'title status');

    // 3. Votes per candidate
    const candidateIds = candidates.map(c => c._id);
    const votes = await Vote.aggregate([
        { $match: { candidateId: { $in: candidateIds.map(id => id.toString()) } } },
        { $group: { _id: "$candidateId", count: { $sum: 1 } } }
    ]);

    const votesMap: Record<string, number> = {};
    votes.forEach(v => votesMap[v._id] = v.count);

    const candidatesWithStats = candidates.map(c => ({
        id: c._id,
        name: c.name,
        electionName: (c.electionId as any)?.title,
        electionStatus: (c.electionId as any)?.status,
        votes: votesMap[c._id.toString()] || 0
    }));

    // 4. Active Elections (Global)
    const activeElections = await Election.find({ status: { $in: ['ACTIVE', 'OPEN'] } }).select('title status startDate endDate');

    return NextResponse.json({
        party: {
            name: party?.name,
            description: party?.description,
            status: party?.status
        },
        stats: {
            totalMembers,
            candidates: candidatesWithStats,
            activeElections
        }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Party dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

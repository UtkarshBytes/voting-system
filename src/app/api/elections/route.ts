export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import { blockchainService } from '@/lib/blockchain';
import { Election } from '@/models/Election';
import { User } from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');

    await dbConnect();

    let query: any = {};
    if (statusFilter) {
        if (statusFilter === 'OPEN') {
             query = { $or: [{ status: 'OPEN' }, { status: 'ACTIVE' }] };
        } else {
             query = { status: statusFilter };
        }
    }

    const elections = await Election.find(query);

    // Attach total votes
    // Need to use Promise.all for async map
    const electionsWithStats = await Promise.all(elections.map(async (e) => {
      const totalVotes = await blockchainService.getTotalVotes(e._id.toString());
      return {
        ...e.toObject(),
        id: e._id.toString(),
        startTime: e.startTime,
        endTime: e.endTime,
        totalVotes
      };
    }));

    return NextResponse.json(electionsWithStats, { status: 200 });
  } catch (error) {
    console.error('Get elections error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, candidates, startTime, endTime } = body;

    if (!title || !candidates || !startTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const startDate = new Date(startTime);
    const endDate = endTime ? new Date(endTime) : undefined;

    // Ensure candidates have IDs
    const formattedCandidates = candidates.map((c: any) => {
        // Simple random ID if missing, or use provided
        return {
            ...c,
            id: c.id || Math.random().toString(36).substring(2, 15)
        };
    });

    const newElection = await Election.create({
      title,
      candidates: formattedCandidates,
      status: 'ACTIVE',
      startTime: startDate.getTime(),
      endTime: endDate ? endDate.getTime() : undefined,
      startDate,
      endDate,
      createdBy: session.id
    });

    return NextResponse.json({
        ...newElection.toObject(),
        id: newElection._id.toString()
    }, { status: 201 });

  } catch (error) {
    console.error('Create election error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

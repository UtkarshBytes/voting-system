export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import { blockchainService } from '@/lib/blockchain';
import { Election } from '@/models/Election';
import { User } from '@/models/User';
import { Candidate } from '@/models/Candidate';
import { Party } from '@/models/Party';

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

    const newElection = await Election.create({
      title,
      status: 'ACTIVE',
      startTime: startDate.getTime(),
      endTime: endDate ? endDate.getTime() : undefined,
      startDate,
      endDate,
      createdBy: session.id
    });

    // Create candidates in the Candidate collection
    if (candidates && Array.isArray(candidates) && candidates.length > 0) {
        for (const c of candidates) {
            let partyId = c.partyId;

            // Backward compatibility: If party is a string name, find or create the party
            if (!partyId && c.party) {
                let party = await Party.findOne({ name: c.party });
                if (!party) {
                    // Create a party if it doesn't exist to allow the election creation to proceed
                    // This is a migration helper for the new architecture
                    party = await Party.create({
                        name: c.party,
                        description: 'Auto-created during election setup',
                        status: 'ACTIVE',
                        createdByAdminId: session.id
                    });
                }
                partyId = party._id;
            }

            // If we still don't have a partyId, create an "Independent" party
            if (!partyId) {
                 let independentParty = await Party.findOne({ name: 'Independent' });
                 if (!independentParty) {
                     independentParty = await Party.create({
                         name: 'Independent',
                         status: 'ACTIVE',
                         createdByAdminId: session.id
                     });
                 }
                 partyId = independentParty._id;
            }

            await Candidate.create({
                name: c.name,
                partyId: partyId,
                electionId: newElection._id,
                createdByPartyId: partyId, // Assume created by the party itself for now
                imageUrl: c.imageUrl
            });
        }
    }

    return NextResponse.json({
        ...newElection.toObject(),
        id: newElection._id.toString()
    }, { status: 201 });

  } catch (error) {
    console.error('Create election error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

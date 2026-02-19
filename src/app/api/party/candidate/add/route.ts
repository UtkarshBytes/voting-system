export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import { User } from '@/models/User';
import { Party } from '@/models/Party';
import { Election } from '@/models/Election';
import { Candidate } from '@/models/Candidate';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(session.id);
    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Role Guard
    if (user.role !== 'PARTY_LEADER') {
        return NextResponse.json({ error: 'Forbidden: Only Party Leaders can add candidates' }, { status: 403 });
    }

    if (!user.partyId) {
        return NextResponse.json({ error: 'User is not assigned to a party' }, { status: 400 });
    }

    const { name, electionId, imageUrl } = await req.json();

    if (!name || !electionId) {
        return NextResponse.json({ error: 'Name and Election ID are required' }, { status: 400 });
    }

    // Check Election Status
    const election = await Election.findById(electionId);
    if (!election) {
        return NextResponse.json({ error: 'Election not found' }, { status: 404 });
    }

    if (election.status !== 'ACTIVE' && election.status !== 'OPEN') {
         return NextResponse.json({ error: 'Election is not active' }, { status: 400 });
    }

    // Ensure Party is Active (Optional, but good practice)
    const party = await Party.findById(user.partyId);
    if (!party || party.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Party is inactive' }, { status: 403 });
    }

    // Create Candidate
    const candidate = await Candidate.create({
        name,
        partyId: user.partyId,
        electionId: election._id,
        createdByPartyId: user.partyId,
        imageUrl
    });

    return NextResponse.json({ message: 'Candidate added successfully', candidate }, { status: 201 });

  } catch (error: any) {
    console.error('Add candidate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

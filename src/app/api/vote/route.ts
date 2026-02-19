export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getSession, euclideanDistance, verifyPassword, normalizeDescriptor } from '@/lib/auth';
import { blockchainService } from '@/lib/blockchain';
import { User } from '@/models/User';
import { Election } from '@/models/Election';
import { Vote } from '@/models/Vote';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { electionId, candidateId, faceDescriptor, password } = await req.json();

    if (!electionId || !candidateId) {
      return NextResponse.json({ error: 'Missing election/candidate parameters' }, { status: 400 });
    }

    await dbConnect();

    // 1. Validate User
    const user = await User.findById(session.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Authorization (Biometric OR Password)
    let authorized = false;

    // Check Face
    if (faceDescriptor) {
        let inputDescriptor: number[];
        if (typeof faceDescriptor === 'object' && 'values' in faceDescriptor) {
            inputDescriptor = Object.values(faceDescriptor) as number[];
        } else {
            inputDescriptor = Array.from(faceDescriptor);
        }

        if (inputDescriptor.length === 128) {
            if (user.faceDescriptor && user.faceDescriptor.length === 128) {
                // Ensure both descriptors are normalized before comparison
                const normalizedInput = normalizeDescriptor(inputDescriptor);
                const normalizedStored = normalizeDescriptor(user.faceDescriptor);

                const distance = euclideanDistance(normalizedStored, normalizedInput);
                console.log(`Vote authorization face distance: ${distance}`);
                const THRESHOLD = 0.40;
                if (distance < THRESHOLD) {
                    authorized = true;
                } else {
                    console.log("Face verification failed (distance too high)");
                }
            } else {
                 console.log("User has no stored face descriptor to match against.");
            }
        }
    }

    // Check Password (Fallback)
    if (!authorized && password) {
        console.log("Attempting password fallback for vote...");
        const isPasswordValid = await verifyPassword(password, user.passwordHash);
        if (isPasswordValid) {
            authorized = true;
        } else {
            console.log("Password verification failed.");
        }
    }

    if (!authorized) {
        // Construct specific error message
        if (faceDescriptor && !password) return NextResponse.json({ error: 'Biometric verification failed. Try again or use password.' }, { status: 401 });
        if (!faceDescriptor && !password) return NextResponse.json({ error: 'Verification required (Face or Password).' }, { status: 400 });
        return NextResponse.json({ error: 'Authorization failed. Invalid credentials.' }, { status: 401 });
    }

    // 3. Validate Election
    const election = await Election.findById(electionId);
    if (!election) {
      return NextResponse.json({ error: 'Election not found' }, { status: 404 });
    }

    if (election.status !== 'OPEN' && election.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Election is closed' }, { status: 400 });
    }

    // 4. Check Double Vote
    const existingVote = await Vote.findOne({ voterId: user._id, electionId });
    if (existingVote) {
      return NextResponse.json({ error: 'User has already voted in this election' }, { status: 400 });
    }

    // 5. Create Transaction (Vote Payload)
    const votePayload = blockchainService.createVoteTransaction(user._id, candidateId, electionId);

    // 6. Mine Block (Save Vote & Block)
    const minedVote = await blockchainService.castVote(votePayload);

    return NextResponse.json({
      message: 'Vote cast successfully',
      receipt: {
        transactionHash: minedVote.transactionHash,
        blockNumber: minedVote.blockNumber,
        timestamp: minedVote.timestamp,
        voteVerificationCode: minedVote.voteCode,
        candidateId,
        electionId
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getSession, verifyPassword } from '@/lib/auth';
import { blockchainService } from '@/lib/blockchain';
import { User } from '@/models/User';
import { Election } from '@/models/Election';
import { Vote } from '@/models/Vote';
import { Otp } from '@/models/Otp';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { otp, electionId } = await req.json();

    if (!otp || !electionId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    await dbConnect();

    // 1. Find OTP
    const otpRecord = await Otp.findOne({ userId: session.id, electionId: electionId });

    if (!otpRecord) {
        return NextResponse.json({ error: 'OTP not found or expired' }, { status: 400 });
    }

    // 2. Check Expiry
    if (new Date() > otpRecord.expiresAt) {
        await Otp.deleteOne({ _id: otpRecord._id });
        return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
    }

    // 3. Check Attempts
    if (otpRecord.attempts >= 2) {
        await Otp.deleteOne({ _id: otpRecord._id });
        return NextResponse.json({ error: 'OTP invalidated due to too many attempts' }, { status: 400 });
    }

    // 4. Verify Hash
    const isValid = await verifyPassword(otp, otpRecord.otpHash);

    if (!isValid) {
        otpRecord.attempts += 1;

        if (otpRecord.attempts >= 2) {
            await Otp.deleteOne({ _id: otpRecord._id });
            return NextResponse.json({ error: 'OTP invalidated. Too many failed attempts.' }, { status: 400 });
        } else {
            await otpRecord.save();
            return NextResponse.json({ error: 'Invalid OTP. 1 attempt remaining.' }, { status: 400 });
        }
    }

    // 5. Success - Cast Vote
    // Re-validate Election Status & Double Vote (Safety check before commit)
    const user = await User.findById(session.id);
    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const election = await Election.findById(electionId);
    if (!election) {
      return NextResponse.json({ error: 'Election not found' }, { status: 404 });
    }

    if (election.status !== 'OPEN' && election.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Election is closed' }, { status: 400 });
    }

    const existingVote = await Vote.findOne({ voterId: user._id, electionId });
    if (existingVote) {
      return NextResponse.json({ error: 'User has already voted in this election' }, { status: 400 });
    }

    // Create Transaction (Vote Payload) using candidateId from OTP record
    const votePayload = blockchainService.createVoteTransaction(user._id, otpRecord.candidateId, electionId);

    // Mine Block (Save Vote & Block)
    const minedVote = await blockchainService.castVote(votePayload);

    // Delete used OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    return NextResponse.json({
      message: 'Vote cast successfully',
      receipt: {
        transactionHash: minedVote.transactionHash,
        blockNumber: minedVote.blockNumber,
        timestamp: minedVote.timestamp,
        voteVerificationCode: minedVote.voteCode,
        candidateId: otpRecord.candidateId,
        electionId
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

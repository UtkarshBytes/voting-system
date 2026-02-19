export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { User } from '@/models/User';
import { Vote } from '@/models/Vote';

export async function GET(req: NextRequest) {
  try {
    const token = cookies().get('token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session || !session.id) {
        return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(session.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get voting history
    const votes = await Vote.find({ voterId: user._id });

    const hasVoted: Record<string, boolean> = {};
    votes.forEach((vote) => {
        // vote.electionId is ObjectId, need string
        hasVoted[vote.electionId.toString()] = true;
    });

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        kycVerified: user.kycVerified,
        kyc: user.kyc,
        faceDescriptor: user.faceDescriptor,
        hasVoted
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

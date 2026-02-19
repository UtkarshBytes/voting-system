export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import { User } from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { faceDescriptor } = await req.json();

    if (!faceDescriptor) {
        return NextResponse.json({ error: 'Face descriptor is required' }, { status: 400 });
    }

    // Validate descriptor format
    let descriptor: number[];
    if (typeof faceDescriptor === 'object' && 'values' in faceDescriptor) {
        descriptor = Object.values(faceDescriptor) as number[];
    } else {
        descriptor = Array.from(faceDescriptor);
    }

    if (descriptor.length !== 128) {
        return NextResponse.json({ error: 'Invalid face descriptor format' }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findById(session.id);
    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.faceDescriptor = descriptor;

    // Initialize kyc if missing
    if (!user.kyc) {
        user.kyc = {
            status: 'NOT_STARTED',
            submittedAt: Date.now(),
            reviewedAt: Date.now()
        };
    }

    // Assuming adding face implies verification or at least intent
    if (user.kyc.status === 'NOT_STARTED' || user.kyc.status === 'PENDING') {
        user.kyc.status = 'VERIFIED';
        user.kycVerified = true;
    }

    await user.save();

    return NextResponse.json({ message: 'Face data registered successfully' }, { status: 200 });

  } catch (error) {
    console.error('Register face error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { hashPassword } from '@/lib/auth';
import { User } from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role, orgId, faceDescriptor } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (role === 'ADMIN' && !orgId) {
      return NextResponse.json({ error: 'Organization ID is required for Admin registration' }, { status: 400 });
    }

    await dbConnect();

    // Check existing
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);

    // Convert TypedArray
    let descriptor: number[] | undefined = undefined;
    if (faceDescriptor) {
        if (Array.isArray(faceDescriptor)) {
            descriptor = faceDescriptor;
        } else if (typeof faceDescriptor === 'object' && 'values' in faceDescriptor) {
             descriptor = Object.values(faceDescriptor) as number[];
        } else {
             descriptor = Array.from(faceDescriptor);
        }
    }

    const newUser = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      faceDescriptor: descriptor,
      role,
      orgId: role === 'ADMIN' ? orgId : undefined,
      hasVoted: false,
      kycVerified: !!descriptor,
      kyc: {
        status: descriptor ? 'VERIFIED' : 'NOT_STARTED',
        submittedAt: Date.now(),
        reviewedAt: Date.now()
      }
    });

    return NextResponse.json({
        message: 'User registered successfully',
        user: {
            id: newUser._id.toString(),
            name,
            email,
            role
        }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    // Include error message in response for debugging (remove in prod if sensitive)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

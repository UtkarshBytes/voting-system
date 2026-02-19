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

    await dbConnect();

    // Get user
    const user = await User.findById(session.id);

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user to remove face descriptor
    // In Mongoose, we can set to undefined or use $unset
    user.faceDescriptor = undefined;
    await user.save();

    return NextResponse.json({ message: 'Face data removed successfully' }, { status: 200 });
  } catch (error) {
    console.error('Remove face error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import { User } from '@/models/User';
import { Party } from '@/models/Party';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(session.id);
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, description } = await req.json();

    if (!name) {
        return NextResponse.json({ error: 'Party name is required' }, { status: 400 });
    }

    const existing = await Party.findOne({ name });
    if (existing) {
        return NextResponse.json({ error: 'Party name already exists' }, { status: 409 });
    }

    const party = await Party.create({
        name,
        description,
        status: 'ACTIVE',
        createdByAdminId: user._id
    });

    return NextResponse.json({ message: 'Party created', party }, { status: 201 });

  } catch (error: any) {
    console.error('Create party error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

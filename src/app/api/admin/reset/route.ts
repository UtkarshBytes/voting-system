export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import { blockchainService } from '@/lib/blockchain';
import { User } from '@/models/User';
import { Election } from '@/models/Election';
import { Vote } from '@/models/Vote';
import { Block } from '@/models/Block';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Clear all data
    await User.deleteMany({});
    await Election.deleteMany({});
    await Vote.deleteMany({});
    await Block.deleteMany({});

    // Re-initialize Blockchain (Genesis Block)
    await blockchainService.initialize();

    return NextResponse.json({ message: 'Database reset successfully. You will be logged out.' }, { status: 200 });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import { blockchainService } from '@/lib/blockchain';
import { User } from '@/models/User';
import { Election } from '@/models/Election';
import { Vote } from '@/models/Vote';
import { Block } from '@/models/Block';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Stats
    const totalVoters = await User.countDocuments({ role: 'USER' });
    const activeElectionsCount = await Election.countDocuments({ status: 'ACTIVE' });

    // KYC Stats
    const kycAgg = await User.aggregate([
        { $match: { role: 'USER' } },
        { $group: { _id: "$kyc.status", count: { $sum: 1 } } }
    ]);

    const kycDistribution: Record<string, number> = {
        VERIFIED: 0,
        PENDING: 0,
        NOT_STARTED: 0,
        REJECTED: 0
    };

    let pendingKycCount = 0;

    kycAgg.forEach((doc: any) => {
        const status = doc._id || 'NOT_STARTED';
        if (kycDistribution[status] !== undefined) {
            kycDistribution[status] = doc.count;
        }
        if (status === 'PENDING') pendingKycCount = doc.count;
    });

    // Blockchain Stats
    const latestBlock = await blockchainService.getLatestBlock();
    const blockchainHeight = (latestBlock?.index || 0) + 1;
    const totalTransactions = await blockchainService.getTotalTransactions();

    // Recent Activity
    const recentBlocks = await Block.find().sort({ index: -1 }).limit(5);
    const recentVotes = await Vote.find().sort({ timestamp: -1 }).limit(5);

    const activityFeed: Array<{type: string, timestamp: number, details: string}> = [];

    recentBlocks.forEach(b => {
        activityFeed.push({
            type: 'BLOCK_MINED',
            timestamp: b.timestamp,
            details: `Block #${b.index} mined with ${b.transactions.length} transactions`
        });
    });

    recentVotes.forEach(v => {
        activityFeed.push({
            type: 'VOTE_CAST',
            timestamp: v.timestamp,
            details: `Vote cast in election ${v.electionId.toString().substring(0, 8)}...`
        });
    });

    const sortedActivity = activityFeed.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);

    return NextResponse.json({
      activeElectionsCount,
      totalVoters,
      pendingKycCount,
      kycDistribution,
      blockchain: {
          height: blockchainHeight,
          latestBlockIndex: latestBlock?.index || 0,
          latestBlockHash: latestBlock?.hash || '0',
          totalTransactions
      },
      recentActivity: sortedActivity
    }, { status: 200 });

  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

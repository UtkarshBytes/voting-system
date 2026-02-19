import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import { Block, IBlock } from '@/models/Block';
import { Vote, IVote } from '@/models/Vote';
import { ObjectId } from 'mongodb'; // or mongoose.Types.ObjectId

export class BlockchainService {
  private difficulty = 2;

  // 1. Get Latest Block
  public async getLatestBlock(): Promise<IBlock | null> {
    await dbConnect();
    const block = await Block.findOne().sort({ index: -1 });
    return block;
  }

  // 2. Initialize Genesis Block if Chain is Empty
  public async initialize(): Promise<void> {
    await dbConnect();
    const latest = await this.getLatestBlock();
    if (!latest) {
      console.log("No blocks found. Creating Genesis Block...");
      const genesisBlock = {
        index: 0,
        timestamp: Date.now(),
        transactions: [],
        previousHash: "0",
        hash: "0",
        nonce: 0,
      };
      // Calculate hash manually or reuse method if adapted
      // Need to cast to IBlock-like structure for calculation
      const hash = this.calculateBlockHash(genesisBlock as any);
      genesisBlock.hash = hash;

      await Block.create(genesisBlock);
      console.log("Genesis Block created.");
    }
  }

  // 3. Create Transaction (Vote Payload)
  public createVoteTransaction(voterId: string | ObjectId, candidateId: string, electionId: string | ObjectId): Partial<IVote> {
    return {
      voterId: voterId as any,
      candidateId,
      electionId: electionId as any,
      transactionHash: '',
      voteCode: this.generateVerificationCode(),
    };
  }

  // 4. Mine Block (Save Vote)
  public async castVote(voteData: Partial<IVote>): Promise<IVote> {
    await dbConnect();
    const previousBlock = await this.getLatestBlock();

    if (!previousBlock) {
        await this.initialize();
        return this.castVote(voteData);
    }

    const newIndex = previousBlock.index + 1;
    const timestamp = Date.now();

    // Prepare Vote Object
    // We need to calculate hash before saving
    // Temporarily create object
    const votePayload = {
      ...voteData,
      blockNumber: newIndex,
      timestamp,
      transactionHash: ''
    };

    // Calculate Hash for the transaction (Vote)
    const { transactionHash, ...dataToHash } = votePayload;
    votePayload.transactionHash = crypto.createHash('sha256').update(JSON.stringify(dataToHash)).digest('hex');

    // Create Vote Document
    const savedVote = await Vote.create(votePayload);

    // Create Block with embedded transaction
    const newBlock = {
      index: newIndex,
      timestamp,
      transactions: [savedVote.toObject()], // Embed plain object
      previousHash: previousBlock.hash,
      hash: '',
      nonce: 0
    };

    // Proof of Work
    this.proofOfWork(newBlock as any);

    // Save Block
    await Block.create(newBlock);

    return savedVote;
  }

  private generateVerificationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let part1 = '';
    let part2 = '';
    for (let i = 0; i < 4; i++) {
        part1 += chars.charAt(Math.floor(Math.random() * chars.length));
        part2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `VOTE-${part1}-${part2}`;
  }

  private calculateBlockHash(block: { index: number, previousHash: string, timestamp: number, transactions: any[], nonce: number }): string {
    return crypto
      .createHash('sha256')
      .update(
        block.index +
        block.previousHash +
        block.timestamp +
        JSON.stringify(block.transactions) +
        block.nonce
      )
      .digest('hex');
  }

  private proofOfWork(block: { index: number, previousHash: string, timestamp: number, transactions: any[], nonce: number, hash: string }): void {
    block.nonce = 0;
    let hash = this.calculateBlockHash(block);
    const target = Array(this.difficulty + 1).join("0");
    while (hash.substring(0, this.difficulty) !== target) {
      block.nonce++;
      hash = this.calculateBlockHash(block);
    }
    block.hash = hash;
  }

  // Stats Helpers
  public async getTotalTransactions(): Promise<number> {
      await dbConnect();
      return await Vote.countDocuments();
  }

  public async getVoteCounts(electionId: string): Promise<Record<string, number>> {
      await dbConnect();
      // Aggregate
      const results = await Vote.aggregate([
          { $match: { electionId: new ObjectId(electionId) } }, // Ensure ObjectId if stored as such
          { $group: { _id: "$candidateId", count: { $sum: 1 } } }
      ]);

      const counts: Record<string, number> = {};
      results.forEach((r: any) => {
          counts[r._id] = r.count;
      });
      return counts;
  }

  public async getTotalVotes(electionId: string): Promise<number> {
      await dbConnect();
      // Try string and objectid query just in case
      try {
        return await Vote.countDocuments({ electionId: new ObjectId(electionId) });
      } catch {
        return await Vote.countDocuments({ electionId: electionId });
      }
  }
}

export const blockchainService = new BlockchainService();

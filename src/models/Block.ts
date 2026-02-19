import mongoose, { Schema, Document, Model } from 'mongoose';
import { IVote } from './Vote';

export interface IBlock extends Document {
  index: number;
  timestamp: number;
  transactions: IVote[];
  previousHash: string;
  hash: string;
  nonce: number;
}

// Embed votes in blocks for simplicity in this educational model,
// or reference them. Embedding preserves snapshot.
// We'll treat transactions as an array of objects matching Vote structure but detached or references.
// For immutability, embedding the data is safer.

const BlockSchema = new Schema<IBlock>({
  index: { type: Number, required: true, unique: true },
  timestamp: { type: Number, required: true },
  transactions: { type: [Schema.Types.Mixed], default: [] }, // Storing full vote objects
  previousHash: { type: String, required: true },
  hash: { type: String, required: true, unique: true },
  nonce: { type: Number, required: true }
}, { timestamps: true });

export const Block: Model<IBlock> = mongoose.models.Block || mongoose.model<IBlock>('Block', BlockSchema);

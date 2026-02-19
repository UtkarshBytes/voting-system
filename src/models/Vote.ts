import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVote extends Document {
  electionId: mongoose.Types.ObjectId | string;
  candidateId: string;
  voterId: mongoose.Types.ObjectId | string;
  transactionHash: string;
  voteCode: string;
  blockNumber: number;
  timestamp: number;
}

const VoteSchema = new Schema<IVote>({
  electionId: { type: Schema.Types.ObjectId, ref: 'Election', required: true },
  candidateId: { type: String, required: true },
  voterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  transactionHash: { type: String, required: true, unique: true },
  voteCode: { type: String, required: true, unique: true },
  blockNumber: { type: Number, required: true },
  timestamp: { type: Number, required: true }
}, { timestamps: true });

export const Vote: Model<IVote> = mongoose.models.Vote || mongoose.model<IVote>('Vote', VoteSchema);

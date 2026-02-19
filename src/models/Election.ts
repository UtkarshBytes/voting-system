import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICandidate {
  id: string; // Internal UUID
  name: string;
  party: string;
  imageUrl?: string;
}

export interface IElection extends Document {
  title: string;
  candidates: ICandidate[];
  status: 'OPEN' | 'CLOSED' | 'ACTIVE';
  startTime: number;
  endTime?: number;
  startDate?: Date;
  endDate?: Date;
  createdBy?: mongoose.Types.ObjectId;
}

const CandidateSchema = new Schema<ICandidate>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  party: { type: String, required: true },
  imageUrl: String
}, { _id: false });

const ElectionSchema = new Schema<IElection>({
  title: { type: String, required: true },
  candidates: [CandidateSchema],
  status: { type: String, enum: ['OPEN', 'CLOSED', 'ACTIVE'], default: 'ACTIVE' },
  startTime: { type: Number, required: true },
  endTime: Number,
  startDate: Date,
  endDate: Date,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export const Election: Model<IElection> = mongoose.models.Election || mongoose.model<IElection>('Election', ElectionSchema);

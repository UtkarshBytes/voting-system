import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IElection extends Document {
  title: string;
  // candidates: Removed in favor of Candidate collection
  status: 'OPEN' | 'CLOSED' | 'ACTIVE';
  startTime: number;
  endTime?: number;
  startDate?: Date;
  endDate?: Date;
  createdBy?: mongoose.Types.ObjectId;
}

const ElectionSchema = new Schema<IElection>({
  title: { type: String, required: true },
  // candidates: Removed
  status: { type: String, enum: ['OPEN', 'CLOSED', 'ACTIVE'], default: 'ACTIVE' },
  startTime: { type: Number, required: true },
  endTime: Number,
  startDate: Date,
  endDate: Date,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export const Election: Model<IElection> = mongoose.models.Election || mongoose.model<IElection>('Election', ElectionSchema);

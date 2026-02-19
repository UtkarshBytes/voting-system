import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICandidate extends Document {
  name: string;
  partyId: mongoose.Types.ObjectId;
  electionId: mongoose.Types.ObjectId;
  createdByPartyId: mongoose.Types.ObjectId;
  imageUrl?: string;
}

const CandidateSchema = new Schema<ICandidate>({
  name: { type: String, required: true },
  partyId: { type: Schema.Types.ObjectId, ref: 'Party', required: true },
  electionId: { type: Schema.Types.ObjectId, ref: 'Election', required: true },
  createdByPartyId: { type: Schema.Types.ObjectId, ref: 'Party', required: true },
  imageUrl: String
}, { timestamps: true });

// Index for efficient lookups
CandidateSchema.index({ electionId: 1 });
CandidateSchema.index({ partyId: 1 });

export const Candidate: Model<ICandidate> = mongoose.models.Candidate || mongoose.model<ICandidate>('Candidate', CandidateSchema);

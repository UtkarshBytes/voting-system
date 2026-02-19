import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IParty extends Document {
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdByAdminId: mongoose.Types.ObjectId;
}

const PartySchema = new Schema<IParty>({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  createdByAdminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export const Party: Model<IParty> = mongoose.models.Party || mongoose.model<IParty>('Party', PartySchema);

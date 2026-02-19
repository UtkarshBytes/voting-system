import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  faceDescriptor?: number[];
  role: 'USER' | 'ADMIN';
  orgId?: string;
  hasVoted: boolean;
  kycVerified: boolean;
  kyc?: {
    status: 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
    fullName?: string;
    idNumber?: string;
    submittedAt?: number;
    reviewedAt?: number;
  };
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  faceDescriptor: { type: [Number], default: undefined },
  role: { type: String, enum: ['USER', 'ADMIN'], required: true },
  orgId: { type: String },
  hasVoted: { type: Boolean, default: false },
  kycVerified: { type: Boolean, default: false },
  kyc: {
    status: { type: String, enum: ['NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED'], default: 'NOT_STARTED' },
    fullName: String,
    idNumber: String,
    submittedAt: Number,
    reviewedAt: Number
  }
}, { timestamps: true });

// Add index on email
UserSchema.index({ email: 1 }, { unique: true });

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOtp extends Document {
  userId: mongoose.Types.ObjectId;
  electionId: mongoose.Types.ObjectId;
  candidateId: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  lastRequestTime: Date;
  requestCount: number;
}

const OtpSchema = new Schema<IOtp>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  electionId: { type: Schema.Types.ObjectId, ref: 'Election', required: true },
  candidateId: { type: String, required: true },
  otpHash: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL index
  attempts: { type: Number, default: 0, max: 2 },
  lastRequestTime: { type: Date, default: Date.now },
  requestCount: { type: Number, default: 0 }
}, { timestamps: true });

// Ensure unique active OTP per user+election? Or just upsert.
// Actually, if a user requests OTP again, we invalidate the old one?
// "Multiple OTP requests → invalidate previous one"
// So we should find and update/replace.

export const Otp: Model<IOtp> = mongoose.models.Otp || mongoose.model<IOtp>('Otp', OtpSchema);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getSession, euclideanDistance, verifyPassword, hashPassword } from '@/lib/auth';
import { User } from '@/models/User';
import { Election } from '@/models/Election';
import { Candidate } from '@/models/Candidate';
import { Vote } from '@/models/Vote';
import { Otp } from '@/models/Otp';
import { sendOtpEmail } from '@/lib/email';
import crypto from 'crypto';

function generateOTP(): string {
  // 6-character alphanumeric OTP (uppercase + numbers)
  const buffer = crypto.randomBytes(4); // 4 bytes = 32 bits > enough for 6 chars
  const hex = buffer.toString('hex').toUpperCase();
  return hex.substring(0, 6);
}

function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length < 2) return email;
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length > 3
    ? name.substring(0, 3) + '*'.repeat(name.length - 3)
    : name.substring(0, 1) + '*'.repeat(name.length - 1);
  return `${maskedName}@${domain}`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { electionId, candidateId, faceDescriptor, password } = await req.json();

    if (!electionId || !candidateId) {
      return NextResponse.json({ error: 'Missing election/candidate parameters' }, { status: 400 });
    }

    await dbConnect();

    // 1. Validate User
    const user = await User.findById(session.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Authorization (Biometric OR Password)
    let authorized = false;

    // Check Face
    if (faceDescriptor) {
        let inputDescriptor: number[];
        if (typeof faceDescriptor === 'object' && 'values' in faceDescriptor) {
            inputDescriptor = Object.values(faceDescriptor) as number[];
        } else {
            inputDescriptor = Array.from(faceDescriptor);
        }

        if (inputDescriptor.length === 128) {
            if (user.faceDescriptor && user.faceDescriptor.length === 128) {
                // Assuming descriptors are already normalized or close to it
                // We use standard Euclidean distance without forced re-normalization
                // as requested to not touch logic.

                const distance = euclideanDistance(user.faceDescriptor, inputDescriptor);
                console.log(`Vote authorization face distance: ${distance}`);

                const THRESHOLD = 0.60;
                if (distance < THRESHOLD) {
                    authorized = true;
                } else {
                    console.log("Face verification failed (distance too high)");
                }
            } else {
                 console.log("User has no stored face descriptor to match against.");
            }
        }
    }

    // Check Password (Fallback)
    if (!authorized && password) {
        console.log("Attempting password fallback for vote...");
        const isPasswordValid = await verifyPassword(password, user.passwordHash);
        if (isPasswordValid) {
            authorized = true;
        } else {
            console.log("Password verification failed.");
        }
    }

    if (!authorized) {
        // Construct specific error message
        if (faceDescriptor && !password) return NextResponse.json({ error: 'Biometric verification failed. Try again or use password.' }, { status: 401 });
        if (!faceDescriptor && !password) return NextResponse.json({ error: 'Verification required (Face or Password).' }, { status: 400 });
        return NextResponse.json({ error: 'Authorization failed. Invalid credentials.' }, { status: 401 });
    }

    // 3. Validate Election
    const election = await Election.findById(electionId);
    if (!election) {
      return NextResponse.json({ error: 'Election not found' }, { status: 404 });
    }

    if (election.status !== 'OPEN' && election.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Election is closed' }, { status: 400 });
    }

    // 4. Check Double Vote
    const existingVote = await Vote.findOne({ voterId: user._id, electionId });
    if (existingVote) {
      return NextResponse.json({ error: 'User has already voted in this election' }, { status: 400 });
    }

    // 5. Rate Limit & Generate OTP
    let otpRecord = await Otp.findOne({ userId: user._id, electionId: electionId });
    const now = Date.now();
    const TEN_MINUTES = 10 * 60 * 1000;

    if (otpRecord) {
        const lastRequest = otpRecord.lastRequestTime ? new Date(otpRecord.lastRequestTime).getTime() : 0;

        if (now - lastRequest > TEN_MINUTES) {
            // Reset rate limit window
            otpRecord.requestCount = 1;
        } else {
            if (otpRecord.requestCount >= 3) {
                 return NextResponse.json({ error: 'Too many OTP requests. Please wait 10 minutes.' }, { status: 429 });
            }
            otpRecord.requestCount += 1;
        }
    }

    const otp = generateOTP();
    const otpHash = await hashPassword(otp);
    const expiresAt = new Date(now + 2 * 60 * 1000); // 2 minutes from now

    if (otpRecord) {
        otpRecord.lastRequestTime = new Date(now);
        otpRecord.candidateId = candidateId;
        otpRecord.otpHash = otpHash;
        otpRecord.expiresAt = expiresAt;
        otpRecord.attempts = 0; // Reset verification attempts
        await otpRecord.save();
    } else {
        // Create new record
        await Otp.create({
            userId: user._id,
            electionId: electionId,
            candidateId: candidateId,
            otpHash: otpHash,
            expiresAt: expiresAt,
            attempts: 0,
            lastRequestTime: new Date(now),
            requestCount: 1
        });
    }

    // Send Email
    // Find candidate name for email
    // Old: const candidate = election.candidates.find((c: any) => c.id === candidateId);
    // New: Look up Candidate model
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
         return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }
    const candidateName = candidate.name;

    try {
        await sendOtpEmail(user.email, otp, election.title, candidateName);
    } catch (emailError: any) {
        console.error('Failed to send OTP email:', emailError);
        return NextResponse.json({ error: 'Failed to send OTP email. Please try again later.' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'OTP sent successfully',
      email: maskEmail(user.email)
    }, { status: 200 });

  } catch (error) {
    console.error('Request OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

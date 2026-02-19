import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'secret-key-123456789');

export async function hashPassword(password: string): Promise<string> {
  // Use Web Crypto API for compatibility with Edge Runtime (Middleware)
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return inputHash === hash;
}

export async function signToken(payload: any): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET_KEY);
}

export async function verifyToken(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function getSession(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export function normalizeDescriptor(descriptor: number[]): number[] {
  const magnitude = Math.sqrt(descriptor.reduce((sum, val) => sum + val * val, 0));
  console.log(`Face descriptor magnitude: ${magnitude}`);

  if (Math.abs(magnitude - 1.0) < 0.01) {
    return descriptor;
  }

  if (magnitude === 0) return descriptor;
  return descriptor.map(val => val / magnitude);
}

export function euclideanDistance(descriptor1: number[], descriptor2: number[]): number {
  if (descriptor1.length !== descriptor2.length) return Infinity;
  return Math.sqrt(
    descriptor1
      .map((val, i) => val - descriptor2[i])
      .reduce((res, diff) => res + Math.pow(diff, 2), 0)
  );
}

export function matchFace(storedDescriptor: number[], inputDescriptor: number[], threshold: number = 0.6): boolean {
  const distance = euclideanDistance(storedDescriptor, inputDescriptor);
  return distance < threshold;
}

export const AuthService = {
    // faceLogin removed as per redesign

    registerFace: async (descriptor: Float32Array) => {
        const response = await fetch('/api/face/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                faceDescriptor: Array.from(descriptor),
            }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Face registration failed');
        }

        return await response.json();
    },

    removeFace: async () => {
        const response = await fetch('/api/face/remove', {
            method: 'POST',
            credentials: 'include',
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to remove face auth');
        }

        return await response.json();
    }
};

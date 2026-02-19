export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import { verifyPassword, signToken } from '@/lib/auth';
import { User } from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, orgId } = body;

    await dbConnect();

    // 1. Identify User
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Validate Role (Admin Org Check)
    if (user.role === 'ADMIN') {
      if (orgId && user.orgId !== orgId) {
         return NextResponse.json({ error: 'Invalid Organization ID' }, { status: 403 });
      }
    }

    // 3. Authenticate (Password Only)
    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate Token
    const token = await signToken({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name
    });

    const response = NextResponse.json({
        message: 'Login successful',
        user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role
        }
    }, { status: 200 });

    cookies().set({
        name: 'token',
        value: token,
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 // 1 day
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

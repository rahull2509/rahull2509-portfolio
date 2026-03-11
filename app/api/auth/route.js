import { NextResponse } from 'next/server';
import { serialize } from 'cookie';
import { signToken, verifyToken } from '../../../src/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = signToken({ email, role: 'admin' });
      const cookie = serialize('ks_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return NextResponse.json(
        { success: true },
        { headers: { 'Set-Cookie': cookie } }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  const token = request.cookies.get('ks_token')?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({ authenticated: true, email: payload.email });
}

export async function DELETE() {
  const cookie = serialize('ks_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return NextResponse.json(
    { success: true },
    { headers: { 'Set-Cookie': cookie } }
  );
}

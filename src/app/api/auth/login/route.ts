import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { generateToken } from '@/lib/auth';
import User from '@/models/User';

export async function POST(request: Request) {
  try {
    await dbConnect();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token with more user info
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json(
      {
        success: true,
        token,
        user: user.toSafeObject(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

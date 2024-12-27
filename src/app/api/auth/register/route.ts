import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  try {
    await dbConnect();

    const { name, email, password, dailyFocusHours } = await request.json();

    // Enhanced validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      preferences: {
        dailyFocusHours: dailyFocusHours || 8,
        notifications: true,
        theme: 'light',
        tools: [],
      },
      profile: {
        bio: '',
        avatar: '',
        goals: [],
      },
    }) as {
      _id: mongoose.Types.ObjectId;
      name: string;
      email: string;
      role: 'user' | 'admin';
    };

    return NextResponse.json(
      {
        success: true, 
        message: 'Registration successful',
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

interface DecodedToken {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

interface UserSettings {
  focus: {
    defaultDuration: number;
    breakDuration: number;
    sessionsBeforeLongBreak: number;
    blockedSites: string[];
    blockedApps: string[];
  };
  notifications: {
    enabled: boolean;
    breakReminders: boolean;
    progressUpdates: boolean;
    teamActivity: boolean;
  };
  theme: {
    mode: 'light' | 'dark';
    color: string;
  };
}

export async function GET(request: Request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authorization token missing' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token) as DecodedToken;

    const user = await User.findById(decoded.id).select('settings');
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, settings: user.settings || {} },
      { status: 200 }
    );
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authorization token missing' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token) as DecodedToken;
    const updates = await request.json() as Partial<UserSettings>;

    if (!validateSettings(updates)) {
      return NextResponse.json(
        { success: false, message: 'Invalid settings format' },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndUpdate(
      decoded.id,
      { $set: { settings: updates } },
      { new: true }
    ).select('settings');

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, settings: user.settings },
      { status: 200 }
    );
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

function validateSettings(settings: Partial<UserSettings>): boolean {
  // Add validation logic here
  return true;
}

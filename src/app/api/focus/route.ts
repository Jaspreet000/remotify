import { NextResponse } from 'next/server';
import {dbConnect} from '@/lib/dbConnect';
import FocusSession from '@/models/FocusSession';
import { verifyJWT, TokenPayload } from '@/lib/auth';
import User from '@/models/User';
import { JwtPayload } from 'jsonwebtoken';

interface DecodedToken extends TokenPayload, JwtPayload {
  role: "user" | "admin";
}

interface FocusSessionData {
  user: string;
  startTime: Date;
  duration: number;
  isCompleted: boolean;
  focusScore?: number;
  blockedItems: Array<{
    type: 'website' | 'app';
    name: string;
  }>;
}

// GET all focus sessions for a user
export async function GET(request: Request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyJWT(token) as unknown as DecodedToken;

    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Get user preferences directly from user model
    const preferences = {
      focusDuration: user.preferences?.focus?.defaultDuration || 25,
      breakDuration: user.preferences?.focus?.breakDuration || 5,
      sessionsPerDay: user.preferences?.focus?.sessionsBeforeLongBreak || 4,
      blockedItems: [
        ...(user.preferences?.focus?.blockedSites || []).map((site: string) => ({ type: 'website' as const, name: site })),
        ...(user.preferences?.focus?.blockedApps || []).map((app: string) => ({ type: 'app' as const, name: app }))
      ]
    };

    return NextResponse.json({ success: true, preferences });
  } catch (error) {
    console.error('Focus Session Error:', error);
    return NextResponse.json({ success: false, message: 'Server error', error });
  }
}

// POST to create new focus session
export async function POST(request: Request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyJWT(token) as unknown as DecodedToken;

    const { duration, blockedItems } = await request.json();

    const sessionData: FocusSessionData = {
      user: decoded.id,
      startTime: new Date(),
      duration,
      isCompleted: false,
      blockedItems: blockedItems || []
    };

    const session = await FocusSession.create(sessionData);
    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error('Focus Session Creation Error:', error);
    return NextResponse.json({ success: false, message: 'Server error', error });
  }
}

// PATCH to update focus session (end it)
export async function PATCH(request: Request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyJWT(token) as unknown as DecodedToken;

    const { sessionId } = await request.json();
    const session = await FocusSession.findOneAndUpdate(
      { _id: sessionId, user: decoded.id },
      { isCompleted: true, endTime: new Date() },
      { new: true }
    );

    if (!session) {
      return NextResponse.json({ success: false, message: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error('Focus Session Update Error:', error);
    return NextResponse.json({ success: false, message: 'Server error', error });
  }
}

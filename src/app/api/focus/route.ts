import { NextResponse } from 'next/server';
import {dbConnect} from '@/lib/dbConnect';
import FocusSession from '@/models/FocusSession';
import { verifyToken } from '@/lib/auth';
import User from '@/models/User';

// GET all focus sessions for a user
export async function GET(request: Request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded: any = verifyToken(token);

    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Get user preferences or use defaults
    const preferences = {
      focusDuration: user.preferences?.focus?.defaultDuration || 25,
      breakDuration: user.preferences?.focus?.breakDuration || 5,
      sessionsPerDay: user.preferences?.focus?.sessionsBeforeLongBreak || 4,
      blockedItems: [
        ...(user.preferences?.focus?.blockedSites || []).map(site => ({ type: 'website', name: site })),
        ...(user.preferences?.focus?.blockedApps || []).map(app => ({ type: 'app', name: app }))
      ]
    };

    return NextResponse.json({ 
      success: true, 
      preferences,
      sessions: user.workSessions || []
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error', error });
  }
}

// POST to create a new focus session
export async function POST(request: Request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded: any = verifyToken(token);

    const { duration } = await request.json();
    const session = await FocusSession.create({
      user: decoded.id,
      duration,
    });

    return NextResponse.json({ success: true, session });
  } catch (error) {
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
    const decoded: any = verifyToken(token);

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
    return NextResponse.json({ success: false, message: 'Server error', error });
  }
}

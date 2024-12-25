import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authorization token missing or invalid' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded: any = verifyToken(token);

    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Get settings or use defaults
    const settings = {
      notifications: {
        email: {
          dailyDigest: user.settings?.notifications?.email?.dailyDigest ?? true,
          weeklyReport: user.settings?.notifications?.email?.weeklyReport ?? true,
          achievements: user.settings?.notifications?.email?.achievements ?? true,
          teamUpdates: user.settings?.notifications?.email?.teamUpdates ?? true
        },
        push: {
          focusReminders: user.settings?.notifications?.push?.focusReminders ?? true,
          breakReminders: user.settings?.notifications?.push?.breakReminders ?? true,
          teamMentions: user.settings?.notifications?.push?.teamMentions ?? true
        }
      },
      focus: {
        defaultDuration: user.settings?.focus?.defaultDuration ?? 25,
        breakDuration: user.settings?.focus?.breakDuration ?? 5,
        longBreakDuration: user.settings?.focus?.longBreakDuration ?? 15,
        sessionsBeforeLongBreak: user.settings?.focus?.sessionsBeforeLongBreak ?? 4,
        autoStartBreaks: user.settings?.focus?.autoStartBreaks ?? true,
        autoStartNextSession: user.settings?.focus?.autoStartNextSession ?? false,
        blockedSites: user.settings?.focus?.blockedSites ?? [],
        blockedApps: user.settings?.focus?.blockedApps ?? []
      },
      theme: {
        mode: user.settings?.theme?.mode ?? 'system',
        color: user.settings?.theme?.color ?? 'blue',
        reducedMotion: user.settings?.theme?.reducedMotion ?? false,
        fontSize: user.settings?.theme?.fontSize ?? 'medium'
      },
      collaboration: {
        showOnline: user.settings?.collaboration?.showOnline ?? true,
        shareStats: user.settings?.collaboration?.shareStats ?? true,
        autoJoinTeamSessions: user.settings?.collaboration?.autoJoinTeamSessions ?? false,
        defaultAvailability: user.settings?.collaboration?.defaultAvailability ?? 'available'
      }
    };

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
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
        { success: false, message: 'Authorization token missing or invalid' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded: any = verifyToken(token);
    const updates = await request.json();

    // Validate settings before saving
    if (!validateSettings(updates)) {
      return NextResponse.json(
        { success: false, message: 'Invalid settings format' },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndUpdate(
      decoded.id,
      { settings: updates },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, settings: user.settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

function validateSettings(settings: any): boolean {
  // Add validation logic here
  return true;
}

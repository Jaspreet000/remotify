import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: {
        workDuration: user.productivitySettings?.workDuration || 25,
        shortBreakDuration: user.productivitySettings?.shortBreakDuration || 5,
        longBreakDuration: user.productivitySettings?.longBreakDuration || 15,
        sessionsUntilLongBreak: user.productivitySettings?.sessionsUntilLongBreak || 4,
        soundEnabled: user.productivitySettings?.soundEnabled ?? true,
        notificationsBlocked: user.productivitySettings?.notificationsBlocked ?? false,
        blockedSites: user.blockedSites || [],
      },
    });
  } catch (error) {
    console.error('Settings API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const settings = await request.json();
    await dbConnect();
    
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { 
        $set: {
          productivitySettings: {
            ...settings,
          }
        }
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: user.productivitySettings,
    });
  } catch (error) {
    console.error('Settings API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

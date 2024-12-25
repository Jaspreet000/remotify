import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { verifyToken } from '@/lib/auth';
import User from '@/models/User';

export async function GET(request: Request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authorization token missing' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded: any = verifyToken(token);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Format the response to match the expected interface
    const formattedUser = {
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.profile?.avatar,
      joinedAt: user.createdAt,
      stats: {
        totalFocusHours: user.focusStats?.totalFocusTime ? Math.round(user.focusStats.totalFocusTime / 60) : 0,
        tasksCompleted: user.focusStats?.totalSessions || 0,
        currentStreak: user.focusStats?.streaks?.current || 0,
        longestStreak: user.focusStats?.streaks?.longest || 0
      },
      achievements: user.gamification?.achievements || [],
      badges: user.gamification?.badges || [],
      teams: user.teams || []
    };

    return NextResponse.json(
      { success: true, user: formattedUser },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authorization token missing' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded: any = verifyToken(token);
    const updates = await request.json();

    const user = await User.findByIdAndUpdate(
      decoded.id,
      { $set: { name: updates.name } },
      { new: true }
    ).select('-password');

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, user },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

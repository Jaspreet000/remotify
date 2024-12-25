import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import Leaderboard from '@/models/Leaderboard';
import { verifyToken } from '@/lib/auth';

// GET: Fetch leaderboard data
export async function GET(request: Request) {
  try {
    await dbConnect();

    // Get timeframe from query params
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'weekly';

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate = new Date();
    switch (timeframe) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    const leaderboardData = await Leaderboard.find({
      lastActive: { $gte: startDate }
    })
      .populate('user', 'name email avatar')
      .sort({ score: -1, focusHours: -1 })
      .limit(20);

    // Format the response
    const formattedData = leaderboardData.map(entry => ({
      _id: entry._id,
      user: {
        name: entry.user.name,
        avatar: entry.user.avatar
      },
      focusHours: entry.focusHours,
      tasksCompleted: entry.tasksCompleted,
      level: entry.level,
      badges: entry.badges,
      weeklyStreak: entry.weeklyStreak,
      score: entry.score
    }));

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch leaderboard.' },
      { status: 500 }
    );
  }
}

// POST: Update user achievements
export async function POST(request: Request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded: any = verifyToken(token);

    const { focusHours, tasksCompleted, badges } = await request.json();

    const updatedLeaderboard = await Leaderboard.findOneAndUpdate(
      { user: decoded.id },
      { $inc: { focusHours, tasksCompleted }, $addToSet: { badges: { $each: badges } } },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, data: updatedLeaderboard });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to update leaderboard.', error },
      { status: 500 }
    );
  }
}

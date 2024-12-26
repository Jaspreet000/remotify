import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import Leaderboard from '@/models/Leaderboard';
import { verifyToken } from '@/lib/auth';

interface DecodedToken {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

interface LeaderboardUpdate {
  focusHours: number;
  tasksCompleted: number;
  badges: string[];
}

// GET: Fetch leaderboard data
export async function GET(request: Request) {
  try {
    await dbConnect();

    // Get timeframe from query params
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'weekly';

    // Calculate date range based on timeframe
    const now = new Date();
    const startDate = new Date();

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
      case 'allTime':
        startDate.setFullYear(2000);
        break;
      default:
        startDate.setDate(now.getDate() - 7); // Default to weekly
    }

    const leaderboardData = await Leaderboard.find({
      updatedAt: { $gte: startDate }
    })
      .sort('-focusHours')
      .populate('user', 'name avatar')
      .limit(100)
      .lean();

    return NextResponse.json({ success: true, data: leaderboardData });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch leaderboard.' },
      { status: 500 }
    );
  }
}

// POST: Update user's leaderboard stats
export async function POST(request: Request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token) as DecodedToken;

    const { focusHours, tasksCompleted, badges } = await request.json() as LeaderboardUpdate;

    const updatedLeaderboard = await Leaderboard.findOneAndUpdate(
      { user: decoded.id },
      { 
        $inc: { 
          focusHours, 
          tasksCompleted 
        }, 
        $addToSet: { 
          badges: { $each: badges } 
        } 
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, data: updatedLeaderboard });
  } catch (error) {
    console.error('Leaderboard update error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update leaderboard.' },
      { status: 500 }
    );
  }
}

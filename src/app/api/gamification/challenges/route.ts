import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import Challenge from '@/models/Challenge';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { generatePersonalizedChallenges } from '@/lib/aiService';
import type { UserDocument } from '@/models/User';

interface DecodedToken {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

interface UserStats {
  level: number;
  experience: number;
  achievements: Array<{
    id: string;
    name: string;
    date: Date;
  }>;
  recentActivity: Array<{
    type: string;
    score: number;
    timestamp: Date;
  }>;
}

interface ChallengeData {
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'achievement' | 'team';
  difficulty: 'easy' | 'medium' | 'hard';
  requirements: {
    focusTime?: number;
    sessions?: number;
    productivity?: number;
    teamParticipation?: number;
  };
  rewards: {
    experience: number;
    badges: string[];
    specialPerks: string[];
  };
}

export async function GET(request: Request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token) as DecodedToken;

    const user = await User.findById(decoded.id)
      .populate<{ workSessions: Array<{
        focusScore: number;
        startTime: Date;
      }> }>('workSessions')
      .populate('teams');

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const userStats: UserStats = {
      level: calculateUserLevel(user),
      experience: user.experience || 0,
      achievements: await getRecentAchievements(decoded.id),
      recentActivity: user.workSessions.slice(-5).map(session => ({
        type: 'focus_session',
        score: session.focusScore,
        timestamp: session.startTime
      }))
    };

    const personalizedChallenges = await generatePersonalizedChallenges(userStats);
    const activeChallenges = await Challenge.find({
      'participants.user': decoded.id,
      'participants.completed': false
    }).populate('teamId');

    return NextResponse.json({
      success: true,
      data: {
        userStats,
        challenges: {
          active: activeChallenges,
          suggested: personalizedChallenges
        }
      }
    });
  } catch (error) {
    console.error('Challenge API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token) as DecodedToken;

    const challengeData: ChallengeData = await request.json();
    const challenge = await Challenge.create({
      ...challengeData,
      participants: [{
        user: decoded.id,
        progress: 0,
        completed: false
      }]
    });

    return NextResponse.json({ success: true, data: challenge });
  } catch (error) {
    console.error('Challenge Creation Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateUserLevel(user: UserDocument): number {
  const baseXP = 1000;
  const experience = user.experience || 0;
  return Math.floor(Math.log(experience / baseXP + 1) / Math.log(1.5)) + 1;
}

async function getRecentAchievements(userId: string) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  return Challenge.find({
    'participants.user': userId,
    'participants.completed': true,
    'participants.completedAt': { $gte: oneWeekAgo }
  }).sort('-participants.completedAt').limit(5);
} 
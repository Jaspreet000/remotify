import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import Challenge from '@/models/Challenge';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { generatePersonalizedChallenges } from '@/lib/aiService';

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
    const decoded: any = verifyToken(token);

    const user = await User.findById(decoded.id)
      .populate('workSessions')
      .populate('teams');

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Get active challenges
    const activeChallenges = await Challenge.find({
      $or: [
        { 'participants.user': user._id },
        { teamId: { $in: user.teams.map(t => t._id) } }
      ],
      endDate: { $gt: new Date() }
    }).populate('participants.user', 'name avatar');

    // Generate new AI challenges if needed
    if (activeChallenges.length < 3) {
      const userStats = {
        focusHistory: user.workSessions,
        preferences: user.preferences,
        completedChallenges: await Challenge.find({
          'participants.user': user._id,
          'participants.completed': true
        })
      };

      const newChallenges = await generatePersonalizedChallenges(userStats);
      await Challenge.insertMany(newChallenges.map(challenge => ({
        ...challenge,
        aiGenerated: true,
        participants: [{ user: user._id }]
      })));
    }

    // Get user's progress and achievements
    const userProgress = {
      level: calculateUserLevel(user),
      experience: user.experience || 0,
      badges: user.badges || [],
      recentAchievements: await getRecentAchievements(user._id),
      leaderboardPosition: await getLeaderboardPosition(user._id)
    };

    return NextResponse.json({
      success: true,
      data: {
        challenges: activeChallenges,
        progress: userProgress
      }
    });
  } catch (error) {
    console.error('Challenges API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { challengeId } = await request.json();

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded: any = verifyToken(token);

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return NextResponse.json(
        { success: false, message: 'Challenge not found' },
        { status: 404 }
      );
    }

    // Add user to challenge participants
    const participantExists = challenge.participants.some(
      p => p.user.toString() === decoded.id
    );

    if (!participantExists) {
      challenge.participants.push({
        user: decoded.id,
        progress: 0,
        completed: false
      });
      await challenge.save();
    }

    return NextResponse.json({ success: true, challenge });
  } catch (error) {
    console.error('Challenge Join Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateUserLevel(user: any) {
  const baseXP = 1000; // XP needed for first level
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

async function getLeaderboardPosition(userId: string) {
  const users = await User.find().sort('-experience');
  return users.findIndex(u => u._id.toString() === userId) + 1;
} 
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { getPersonalizedRecommendations } from '@/lib/aiService';

interface DecodedToken {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

interface WorkSession {
  startTime: Date;
  duration: number;
  focusScore: number;
}

interface UserPreferences {
  dailyFocusHours: number;
  workingHours: {
    start: number;
    end: number;
  };
  breakDuration: number;
}

interface UserData {
  focusStats: {
    totalSessions: number;
    totalFocusTime: number;
    averageFocusScore: number;
    todayProgress: {
      completedSessions: number;
      totalFocusTime: number;
      targetHours: number;
    };
  };
  recentSessions: WorkSession[];
  preferences: UserPreferences;
  habitAnalysis: any; // TODO: Define proper type for habit analysis
}

interface DashboardResponse {
  focusStats: {
    totalSessions: number;
    totalFocusTime: number;
    averageFocusScore: number;
    todayProgress: {
      completedSessions: number;
      totalFocusTime: number;
      targetHours: number;
    };
  };
  recommendations: string[];
  recentActivity: Array<{
    type: string;
    duration: number;
    timestamp: Date;
    score: number;
    summary: string;
  }>;
  streakInfo: {
    current: number;
    longest: number;
    lastActive: string | null;
  };
  productivityScore: number;
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
      .populate('workSessions')
      .populate('habitAnalysis')
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const recentSessions = user.workSessions.slice(-30);
    const todaySessions = recentSessions.filter(
      session => new Date(session.startTime).toDateString() === new Date().toDateString()
    );

    const focusStats = {
      totalSessions: recentSessions.length,
      totalFocusTime: recentSessions.reduce((acc, session) => acc + session.duration, 0),
      averageFocusScore: recentSessions.reduce((acc, session) => acc + (session.focusScore || 0), 0) / recentSessions.length,
      todayProgress: {
        completedSessions: todaySessions.length,
        totalFocusTime: todaySessions.reduce((acc, session) => acc + session.duration, 0),
        targetHours: user.preferences?.dailyFocusHours || 8
      }
    };

    const userData: UserData = {
      focusStats,
      recentSessions,
      preferences: user.preferences,
      habitAnalysis: user.habitAnalysis
    };

    const recommendations = await getPersonalizedRecommendations(userData);

    const response: DashboardResponse = {
      focusStats,
      recommendations,
      recentActivity: formatRecentActivity(recentSessions),
      streakInfo: calculateStreakInfo(recentSessions),
      productivityScore: calculateProductivityScore(userData)
    };

    return NextResponse.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

function formatRecentActivity(sessions: WorkSession[]) {
  return sessions.slice(-5).map(session => ({
    type: 'focus_session',
    duration: session.duration,
    timestamp: session.startTime,
    score: session.focusScore,
    summary: `Completed a ${session.duration} minute focus session`
  }));
}

function calculateStreakInfo(sessions: WorkSession[]) {
  let currentStreak = 0;
  let longestStreak = 0;
  let lastActiveDate = null;

  const sortedSessions = sessions.sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  sortedSessions.forEach((session, index) => {
    const sessionDate = new Date(session.startTime).toDateString();
    
    if (index === 0) {
      currentStreak = 1;
      lastActiveDate = sessionDate;
    } else {
      const prevDate = new Date(sortedSessions[index - 1].startTime).toDateString();
      if (isConsecutiveDay(new Date(sessionDate), new Date(prevDate))) {
        currentStreak++;
      } else {
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }
        currentStreak = 1;
      }
    }
  });

  return {
    current: currentStreak,
    longest: longestStreak,
    lastActive: lastActiveDate
  };
}

function calculateProductivityScore(userData: UserData): number {
  const weights = {
    focusTime: 0.3,
    taskCompletion: 0.2,
    consistency: 0.2,
    improvement: 0.3
  };

  const focusTimeScore = Math.min(
    (userData.focusStats.totalFocusTime / (userData.preferences?.dailyFocusHours * 60)) * 100,
    100
  );

  const taskCompletionScore = userData.focusStats.averageFocusScore;
  const consistencyScore = (userData.focusStats.totalSessions / 30) * 100;
  const improvementScore = calculateImprovementScore(userData.recentSessions);

  return Math.round(
    focusTimeScore * weights.focusTime +
    taskCompletionScore * weights.taskCompletion +
    consistencyScore * weights.consistency +
    improvementScore * weights.improvement
  );
}

function calculateImprovementScore(sessions: WorkSession[]): number {
  if (sessions.length < 2) return 0;

  const recentScores = sessions.slice(-7).map(s => s.focusScore || 0);
  const previousScores = sessions.slice(-14, -7).map(s => s.focusScore || 0);

  const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  const previousAvg = previousScores.reduce((a, b) => a + b, 0) / previousScores.length;

  const improvement = ((recentAvg - previousAvg) / previousAvg) * 100;
  return Math.min(Math.max(improvement, 0), 100);
}

function isConsecutiveDay(date1: Date, date2: Date): boolean {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

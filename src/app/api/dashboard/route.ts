import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { getPersonalizedRecommendations } from '@/lib/aiService';

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
      .populate('habitAnalysis')
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Get recent sessions and calculate metrics
    const recentSessions = user.workSessions.slice(-30);
    const todaySessions = recentSessions.filter(
      session => new Date(session.startTime).toDateString() === new Date().toDateString()
    );

    // Calculate focus stats
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

    // Get AI recommendations based on user data
    const userData = {
      focusStats,
      recentSessions,
      preferences: user.preferences,
      habitAnalysis: user.habitAnalysis
    };

    const aiRecommendations = await getPersonalizedRecommendations(userData);

    // Format recommendations
    const recommendations = parseAIRecommendations(aiRecommendations);

    // Get recent activity
    const recentActivity = formatRecentActivity(recentSessions);

    return NextResponse.json({
      success: true,
      data: {
        focusStats,
        recommendations,
        recentActivity,
        streakInfo: calculateStreakInfo(recentSessions),
        productivityScore: calculateProductivityScore(userData)
      }
    });
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

function parseAIRecommendations(aiResponse: string) {
  try {
    // In a real implementation, you would parse the AI response
    // This is a placeholder that returns formatted recommendations
    return [
      {
        type: 'focus',
        priority: 'high',
        message: 'Your focus peaks in the morning. Consider scheduling important tasks before noon.',
        action: 'Schedule deep work sessions between 9 AM and 12 PM'
      },
      {
        type: 'break',
        priority: 'medium',
        message: 'Taking regular breaks improves your focus scores by 20%',
        action: 'Enable break reminders in your focus settings'
      },
      {
        type: 'environment',
        priority: 'low',
        message: 'Your productivity increases in quiet environments',
        action: 'Try using noise-canceling headphones during focus sessions'
      }
    ];
  } catch (error) {
    console.error('Error parsing AI recommendations:', error);
    return [];
  }
}

function formatRecentActivity(sessions: any[]) {
  return sessions.slice(-5).map(session => ({
    type: 'focus_session',
    duration: session.duration,
    timestamp: session.startTime,
    score: session.focusScore,
    summary: `Completed a ${session.duration} minute focus session`
  }));
}

function calculateStreakInfo(sessions: any[]) {
  let currentStreak = 0;
  let longestStreak = 0;
  let lastActiveDate = null;

  // Sort sessions by date
  const sortedSessions = sessions.sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  // Calculate streaks
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

function calculateProductivityScore(userData: any) {
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

function calculateImprovementScore(sessions: any[]) {
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

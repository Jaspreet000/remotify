import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
  getPersonalizedRecommendations, 
  getProductivityInsights, 
  generateDailyChallenge,
  getWorkflowOptimizations,
  getTeamSyncSuggestions 
} from '@/lib/aiService';
import mongoose from 'mongoose';

interface WorkSession {
  _id: mongoose.Types.ObjectId;
  startTime: Date;
  duration: number;
  focusScore: number;
}

export interface UserPreferences {
  focus: {
    defaultDuration: number;
    breakDuration: number;
    sessionsBeforeLongBreak: number;
    blockedSites: string[];
    blockedApps: string[];
  };
  notifications: {
    enabled: boolean;
    breakReminders: boolean;
    progressUpdates: boolean;
    teamActivity: boolean;
  };
  theme: {
    mode: 'light' | 'dark';
    color: string;
  };
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
  recommendations: {
    dailyHabits: string[];
    improvements: string[];
    workLifeBalance: string[];
  };
  insights: Array<{
    type: string;
    title: string;
    description: string;
    actionableSteps: string[];
  }>;
  dailyChallenge: {
    title: string;
    description: string;
    target: {
      sessions: number;
      minFocusScore: number;
    };
    rewardPoints: number;
  };
  workflowOptimizations: {
    schedule: string[];
    environment: string[];
    techniques: string[];
  };
  teamSync?: {
    synchronization: string[];
    collaboration: string[];
    productivity: string[];
  };
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

export async function GET() {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const recentSessions = user.workSessions?.slice(-30) || [];
    const todaySessions = recentSessions.filter(
      (session: WorkSession) => new Date(session.startTime).toDateString() === new Date().toDateString()
    );

    const focusStats = {
      totalSessions: recentSessions.length,
      totalFocusTime: recentSessions.reduce((acc: number, session: WorkSession) => acc + session.duration, 0),
      averageFocusScore: recentSessions.reduce((acc: number, session: WorkSession) => acc + (session.focusScore || 0), 0) / recentSessions.length || 0,
      todayProgress: {
        completedSessions: todaySessions.length,
        totalFocusTime: todaySessions.reduce((acc: number, session: WorkSession) => acc + session.duration, 0),
        targetHours: user.preferences?.focus?.defaultDuration || 8
      }
    };

    const userData = {
      focusStats,
      recentSessions,
      preferences: user.preferences,
    };

    // Get AI-powered insights and recommendations
    const [
      recommendations,
      insights,
      dailyChallenge,
      workflowOptimizations,
      teamSync
    ] = await Promise.all([
      getPersonalizedRecommendations(userData),
      getProductivityInsights(userData),
      generateDailyChallenge(userData),
      getWorkflowOptimizations(userData),
      user.teamId ? getTeamSyncSuggestions({ 
        members: await User.find({ teamId: user.teamId }),
        sessions: recentSessions,
        metrics: { averageProductivity: focusStats.averageFocusScore }
      }) : null
    ]);

    const response: DashboardResponse = {
      focusStats,
      recommendations,
      insights,
      dailyChallenge,
      workflowOptimizations,
      ...(teamSync && { teamSync }),
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
  let current = 0;
  let longest = 0;
  let lastActive: string | null = null;

  if (sessions.length > 0) {
    const today = new Date().toDateString();
    const sortedDates = sessions
      .map(s => new Date(s.startTime).toDateString())
      .filter((date, index, array) => array.indexOf(date) === index)
      .sort();

    lastActive = sortedDates[sortedDates.length - 1];
    
    if (lastActive === today) {
      current = 1;
      for (let i = sortedDates.length - 2; i >= 0; i--) {
        const date1 = new Date(sortedDates[i]);
        const date2 = new Date(sortedDates[i + 1]);
        const diffDays = Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          current++;
        } else {
          break;
        }
      }
    }

    let tempStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const date1 = new Date(sortedDates[i - 1]);
      const date2 = new Date(sortedDates[i]);
      const diffDays = Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
        longest = Math.max(longest, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
  }

  return {
    current,
    longest,
    lastActive
  };
}

function calculateProductivityScore(userData: any) {
  const {
    focusStats: {
      averageFocusScore,
      totalSessions,
      todayProgress: { totalFocusTime, targetHours }
    }
  } = userData;

  const sessionWeight = 0.3;
  const scoreWeight = 0.4;
  const progressWeight = 0.3;

  const sessionScore = Math.min(totalSessions / 20, 1) * 100;
  const focusScore = averageFocusScore;
  const progressScore = Math.min((totalFocusTime / (targetHours * 60)) * 100, 100);

  return Math.round(
    sessionScore * sessionWeight +
    focusScore * scoreWeight +
    progressScore * progressWeight
  );
}

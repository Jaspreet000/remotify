import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { analyzeProductivityPatterns, type ProductivityData } from "@/lib/aiService";

interface WorkSession {
  startTime: Date;
  duration: number;
  focusScore: number;
  distractions: string[];
}

export async function GET(req: Request) {
  try {
    await dbConnect();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const user = await verifyToken(req);
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userData = await User.findById(user.id)
      .populate<{ workSessions: WorkSession[] }>('workSessions')
      .populate('habitAnalysis');

    if (!userData) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const recentSessions = userData.workSessions.slice(-30);
    const habitAnalysis = userData.getRecentHabitAnalysis(7);

    const analysisData: ProductivityData = {
      sessions: recentSessions.map(session => ({
        startTime: session.startTime,
        duration: session.duration,
        focusScore: session.focusScore,
        distractions: session.distractions
      })),
      habits: {
        summary: {
          averageProductivity: habitAnalysis.reduce((acc, h) => acc + h.productivity, 0) / habitAnalysis.length,
          commonPatterns: []
        }
      },
      preferences: {
        workHours: {
          start: userData.preferences.focus?.defaultDuration?.toString() || "09:00",
          end: userData.preferences.focus?.breakDuration?.toString() || "17:00"
        },
        focusPreferences: {
          duration: userData.preferences.focus?.defaultDuration || 25,
          breaks: userData.preferences.focus?.breakDuration || 5
        }
      }
    };

    const insights = await analyzeProductivityPatterns(analysisData);
    const productivityMetrics = calculateProductivityMetrics(recentSessions);

    const response = {
      habitTrends: formatHabitTrends(recentSessions),
      aiInsights: insights,
      summary: {
        ...productivityMetrics,
        ...habitAnalysis[0]?.summary || {}
      }
    };

    return NextResponse.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error("Error in Analytics API:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

function calculateProductivityMetrics(sessions: WorkSession[]) {
  if (!sessions.length) {
    return {
      averageProductivity: 0,
      topDistractions: [],
      bestTimeBlocks: []
    };
  }

  // Calculate actual metrics based on sessions
  const distractionCounts = sessions.reduce((acc, session) => {
    session.distractions.forEach(distraction => {
      acc[distraction] = (acc[distraction] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const topDistractions = Object.entries(distractionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([type, count]) => ({ type, count }));

  return {
    averageProductivity: Math.round(
      sessions.reduce((acc, s) => acc + s.focusScore, 0) / sessions.length
    ),
    topDistractions,
    bestTimeBlocks: [
      { time: "09:00-11:00", score: 92 },
      { time: "15:00-17:00", score: 88 }
    ]
  };
}

function formatHabitTrends(sessions: WorkSession[]) {
  return sessions.map(session => ({
    date: session.startTime,
    productiveHours: session.duration / 60,
    focusScore: session.focusScore,
    distractions: session.distractions.length
  }));
} 
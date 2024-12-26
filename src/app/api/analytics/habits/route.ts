import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { analyzeProductivityPatterns } from "@/lib/aiService";

interface DecodedToken {
  id: string;
  email: string;
  iat: number;
  exp: number;
}

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
    const decoded = verifyToken(token) as DecodedToken;
    const userId = decoded.id;

    const user = await User.findById(userId)
      .populate('workSessions')
      .populate('habitAnalysis');

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const recentSessions = user.workSessions.slice(-30);
    const habitAnalysis = user.getRecentHabitAnalysis(7);

    const analysisData = {
      sessions: recentSessions,
      habits: habitAnalysis,
      preferences: user.preferences
    };

    const insights = await analyzeProductivityPatterns(analysisData);
    const productivityMetrics = calculateProductivityMetrics(recentSessions);

    const response = {
      habitTrends: formatHabitTrends(recentSessions),
      aiInsights: insights,
      summary: {
        ...productivityMetrics,
        ...habitAnalysis.summary
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
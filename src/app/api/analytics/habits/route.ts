import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { analyzeProductivityPatterns } from "@/lib/aiService";

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

    const token = authHeader.split(" ")[1];
    const decoded: any = verifyToken(token);
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

    // Get recent work sessions and habit analysis
    const recentSessions = user.workSessions.slice(-30);
    const habitAnalysis = user.getRecentHabitAnalysis(7);

    // Prepare data for AI analysis
    const analysisData = {
      sessions: recentSessions,
      habits: habitAnalysis,
      preferences: user.preferences
    };

    // Get AI-powered insights
    const aiInsights = await analyzeProductivityPatterns(analysisData);

    // Calculate productivity metrics
    const productivityMetrics = calculateProductivityMetrics(recentSessions);

    // Format the response
    const response = {
      habitTrends: formatHabitTrends(recentSessions),
      aiInsights: parseAIInsights(aiInsights),
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

function calculateProductivityMetrics(sessions: any[]) {
  // Add your productivity calculation logic here
  return {
    averageProductivity: 85,
    topDistractions: [
      { type: "Social Media", count: 15 },
      { type: "Email", count: 10 },
      { type: "Meetings", count: 8 }
    ],
    bestTimeBlocks: [
      { time: "09:00-11:00", score: 92 },
      { time: "15:00-17:00", score: 88 }
    ]
  };
}

function formatHabitTrends(sessions: any[]) {
  // Add your trend formatting logic here
  return sessions.map(session => ({
    date: session.startTime,
    productiveHours: session.duration / 60,
    focusScore: session.focusScore,
    distractions: session.distractions.length
  }));
}

function parseAIInsights(aiResponse: string) {
  // Parse and format AI insights
  // This is a placeholder - implement actual parsing logic
  return [
    {
      type: 'improvement',
      message: 'Your focus scores are improving',
      impact: 8,
      suggestions: ['Consider longer focus sessions', 'Try the Pomodoro technique']
    }
  ];
} 
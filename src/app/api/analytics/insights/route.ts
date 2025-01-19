import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get('timeRange') || 'week';

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Get team data for comparison
    const teamData = await User.find({
      _id: { $ne: user._id },
    }).select('focusSessions productivityPeaks name');

    // Prepare user data for AI analysis
    const userData = {
      focusSessions: user.focusSessions || [],
      productivityPeaks: user.productivityPeaks || [],
      timeRange,
    };

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Get predictive analytics
    const predictiveResult = await model.generateContent(`You are a JSON-only response API. Analyze the user's focus and productivity patterns and provide predictive analytics.
                 User Data: ${JSON.stringify(userData)}
                 Return ONLY a JSON object with these exact keys:
                 {
                   "projectedFocusTime": number,
                   "projectedProductivity": number,
                   "recommendedBreaks": number,
                   "nextWeekForecast": [{ "date": string, "predictedScore": number }]
                 }`);

    const predictiveResponse = await predictiveResult.response;
    let predictiveMetrics;
    try {
      const cleanedText = predictiveResponse.text().replace(/```json\n|\n```/g, '').trim();
      predictiveMetrics = JSON.parse(cleanedText);
    } catch (e) {
      console.error('Failed to parse predictive metrics:', e);
      predictiveMetrics = {
        projectedFocusTime: 0,
        projectedProductivity: 0,
        recommendedBreaks: 0,
        nextWeekForecast: []
      };
    }

    // Get team performance comparison
    const teamAnalysisResult = await model.generateContent(`You are a JSON-only response API. Compare user's performance with team data and provide insights.
                 User Data: ${JSON.stringify(userData)}
                 Team Data: ${JSON.stringify(teamData)}
                 Return ONLY a JSON object with these exact keys:
                 {
                   "averageFocusTime": number,
                   "averageProductivity": number,
                   "ranking": number,
                   "topPerformers": [{ "name": string, "score": number }]
                 }`);

    const teamAnalysisResponse = await teamAnalysisResult.response;
    let teamComparison;
    try {
      const cleanedText = teamAnalysisResponse.text().replace(/```json\n|\n```/g, '').trim();
      teamComparison = JSON.parse(cleanedText);
    } catch (e) {
      console.error('Failed to parse team comparison:', e);
      teamComparison = {
        averageFocusTime: 0,
        averageProductivity: 0,
        ranking: 0,
        topPerformers: []
      };
    }

    // Get burnout prevention insights
    const burnoutResult = await model.generateContent(`You are a JSON-only response API. Analyze user's work patterns for burnout risk and provide prevention insights.
                 User Data: ${JSON.stringify(userData)}
                 Return ONLY a JSON object with these exact keys:
                 {
                   "riskLevel": "low" | "medium" | "high",
                   "riskFactors": string[],
                   "recommendations": string[],
                   "wellnessScore": number
                 }`);

    const burnoutResponse = await burnoutResult.response;
    let burnoutMetrics;
    try {
      const cleanedText = burnoutResponse.text().replace(/```json\n|\n```/g, '').trim();
      burnoutMetrics = JSON.parse(cleanedText);
    } catch (e) {
      console.error('Failed to parse burnout metrics:', e);
      burnoutMetrics = {
        riskLevel: 'low',
        riskFactors: [],
        recommendations: [],
        wellnessScore: 0
      };
    }

    // Update user's analytics data
    user.analyticsData = {
      lastUpdated: new Date(),
      predictiveMetrics,
      teamComparison,
      burnoutMetrics,
    };
    await user.save();

    return NextResponse.json({
      success: true,
      data: {
        predictiveMetrics,
        teamComparison,
        burnoutMetrics,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/analytics/insights:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 
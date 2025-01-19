import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user.notificationPreferences || [],
    });
  } catch (error) {
    console.error('Error in GET /api/productivity/notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { type, enabled } = await req.json();
    if (!type) {
      return NextResponse.json(
        { success: false, message: 'Notification type is required' },
        { status: 400 }
      );
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Initialize Gemini model for smart notification timing
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Get user's focus patterns and preferences
    const userContext = {
      focusSessions: user.focusSessions || [],
      productivityPeaks: user.productivityPeaks || [],
      notificationPreferences: user.notificationPreferences || [],
    };

    // Use Gemini AI to determine optimal notification timing
    const result = await model.generateContent([
      {
        text: `Analyze the user's focus patterns and determine the optimal notification strategy for ${type} notifications.
               Context: ${JSON.stringify(userContext)}
               Consider:
               1. User's typical focus periods
               2. Productivity peaks
               3. Break patterns
               4. Notification priority
               Provide timing recommendations in JSON format.`
      }
    ]);

    const response = await result.response;
    const aiRecommendations = JSON.parse(response.text());

    // Update notification preferences with AI recommendations
    const prefIndex = user.notificationPreferences?.findIndex(
      (pref: { type: string }) => pref.type === type
    );

    const updatedPref = {
      type,
      enabled,
      priority: aiRecommendations.priority || 'medium',
      timing: aiRecommendations.timing || 'anytime',
      smartRules: aiRecommendations.rules || [],
    };

    if (prefIndex === -1) {
      user.notificationPreferences.push(updatedPref);
    } else {
      user.notificationPreferences[prefIndex] = {
        ...user.notificationPreferences[prefIndex],
        ...updatedPref,
      };
    }

    await user.save();

    return NextResponse.json({
      success: true,
      data: updatedPref,
    });
  } catch (error) {
    console.error('Error in PATCH /api/productivity/notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 
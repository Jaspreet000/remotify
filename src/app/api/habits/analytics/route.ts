// src/app/api/habits/analytics/route.ts
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import HabitLog from '@/models/HabitLog';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export async function GET(req: Request) {
  try {
    await dbConnect();

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'default_secret_key'
    ) as DecodedToken;
    
    const userId = decoded.id;

    const logs = await HabitLog.find({ userId }).sort({ date: -1 });

    // Calculate analytics
    const totalTime = logs.reduce((sum, log) => sum + log.duration, 0);
    const avgBreaks = logs.reduce((sum, log) => sum + log.breaks, 0) / logs.length || 0;
    const avgDistractions = logs.reduce((sum, log) => sum + log.distractions, 0) / logs.length || 0;

    // Generate suggestions based on analytics
    const suggestions = generateSuggestions(avgBreaks, avgDistractions, totalTime);

    return NextResponse.json({ 
      success: true, 
      data: {
        logs,
        analytics: {
          totalTime,
          avgBreaks,
          avgDistractions
        },
        suggestions 
      }
    });
  } catch (error) {
    console.error('Error in analytics API:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

function generateSuggestions(avgBreaks: number, avgDistractions: number, totalTime: number): string[] {
  const suggestions: string[] = [];

  if (avgBreaks < 2) {
    suggestions.push('Take more breaks for better focus.');
  }
  
  if (avgDistractions > 3) {
    suggestions.push('Try using focus tools to minimize distractions.');
  }
  
  if (totalTime > 480) { // 8 hours
    suggestions.push('You are overworking. Plan your time wisely.');
  }

  return suggestions;
}

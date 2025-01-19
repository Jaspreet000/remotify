import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { getGoogleAuthClient, blockFocusTime, findAvailableSlots, listCalendarEvents } from '@/lib/calendarService';
import { optimizeFocusBlocks } from '@/lib/aiService';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user?.googleRefreshToken) {
      return NextResponse.json(
        { success: false, message: "Google Calendar not connected" },
        { status: 400 }
      );
    }

    const { startTime, duration } = await request.json();
    const auth = await getGoogleAuthClient(user.googleRefreshToken);
    const event = await blockFocusTime(auth, new Date(startTime), duration);

    return NextResponse.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Focus block error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user?.googleRefreshToken) {
      return NextResponse.json(
        { success: false, message: "Google Calendar not connected" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const duration = parseInt(searchParams.get('duration') || '60');
    const startDate = new Date(searchParams.get('startDate') || new Date().toISOString());
    const endDate = new Date(searchParams.get('endDate') || new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString());

    const auth = await getGoogleAuthClient(user.googleRefreshToken);
    const availableSlots = await findAvailableSlots(auth, duration, startDate, endDate);

    // Get AI-optimized focus blocks
    const schedule = await listCalendarEvents(auth, startDate, endDate);
    const productivity = user.productivityData || {};
    const optimizedBlocks = await optimizeFocusBlocks(schedule, productivity);

    return NextResponse.json({
      success: true,
      data: {
        availableSlots,
        optimizedBlocks
      }
    });
  } catch (error) {
    console.error('Available slots error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
} 
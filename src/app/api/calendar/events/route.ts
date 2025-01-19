import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { getGoogleAuthClient, listCalendarEvents } from '@/lib/calendarService';

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
    const timeMin = new Date(searchParams.get('timeMin') || new Date().toISOString());
    const timeMax = new Date(searchParams.get('timeMax') || new Date(timeMin.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString());

    const auth = await getGoogleAuthClient(user.googleRefreshToken);
    const events = await listCalendarEvents(auth, timeMin, timeMax);

    return NextResponse.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Calendar events error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
} 
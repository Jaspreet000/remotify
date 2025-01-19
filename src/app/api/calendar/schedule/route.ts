import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { getGoogleAuthClient, listCalendarEvents, createCalendarEvent } from '@/lib/calendarService';
import { suggestMeetingSchedule } from '@/lib/aiService';

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

    const { attendees, duration, preferences } = await request.json();
    const auth = await getGoogleAuthClient(user.googleRefreshToken);

    // Get next 7 days of events
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const events = await listCalendarEvents(auth, startDate, endDate);

    // Get AI suggestions for meeting times
    const suggestions = await suggestMeetingSchedule(events, {
      duration,
      preferences,
      attendees
    });

    if (!suggestions?.optimalTimes?.length) {
      return NextResponse.json(
        { success: false, message: "No suitable time slots found" },
        { status: 404 }
      );
    }

    // Create the calendar event
    const event = await createCalendarEvent(auth, {
      summary: preferences.title || "Meeting",
      description: preferences.description,
      start: {
        dateTime: suggestions.optimalTimes[0],
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: new Date(new Date(suggestions.optimalTimes[0]).getTime() + duration * 60000).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      attendees: attendees.map((email: string) => ({ email })),
    });

    return NextResponse.json({
      success: true,
      data: {
        event,
        suggestions
      }
    });
  } catch (error) {
    console.error('Meeting scheduling error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
} 
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import FocusSession from "@/models/FocusSession";

export async function GET(req: Request) {
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
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Get focus sessions for the user
    const focusSessions = await FocusSession.find({ userId: user._id });

    // Calculate stats
    const totalSessions = focusSessions.length;
    const totalFocusTime = focusSessions.reduce(
      (acc, session) => acc + session.duration,
      0
    );
    const averageFocusScore = focusSessions.length
      ? focusSessions.reduce((acc, session) => acc + session.focusScore, 0) /
        focusSessions.length
      : 0;

    // Calculate completion rate
    const completedSessions = focusSessions.filter(
      (session) => session.status === "completed"
    ).length;
    const completionRate = totalSessions
      ? (completedSessions / totalSessions) * 100
      : 0;

    // Calculate streaks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySessions = focusSessions.filter(
      (session) =>
        new Date(session.startTime).toDateString() === today.toDateString()
    );
    const todayFocusTime = todaySessions.reduce(
      (acc, session) => acc + session.duration,
      0
    );

    // Calculate current streak
    let currentStreak = 0;
    let date = new Date(today);
    while (true) {
      const sessionsOnDate = focusSessions.filter(
        (session) =>
          new Date(session.startTime).toDateString() === date.toDateString()
      );
      if (sessionsOnDate.length === 0) break;
      currentStreak++;
      date.setDate(date.getDate() - 1);
    }

    // Calculate best streak
    let bestStreak = currentStreak;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    focusSessions
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .forEach((session) => {
        const sessionDate = new Date(session.startTime);
        sessionDate.setHours(0, 0, 0, 0);

        if (!lastDate) {
          tempStreak = 1;
        } else {
          const dayDiff = Math.floor(
            (sessionDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (dayDiff === 1) {
            tempStreak++;
          } else if (dayDiff > 1) {
            tempStreak = 1;
          }
        }

        if (tempStreak > bestStreak) {
          bestStreak = tempStreak;
        }

        lastDate = sessionDate;
      });

    return NextResponse.json({
      success: true,
      stats: {
        totalSessions,
        totalFocusTime,
        averageFocusScore,
        completionRate,
        currentStreak,
        bestStreak,
        todayFocusTime,
        weeklyGoal: 1500, // 25 hours per week
      },
    });
  } catch (error) {
    console.error("Focus Stats API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
} 
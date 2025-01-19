import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import Team from '@/models/Team';
import User from '@/models/User';

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
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const team = await Team.findOne({ 'members.userId': user._id })
      .populate('moodTracking.teamMood.responses.userId', 'name image')
      .select('moodTracking');

    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: team.moodTracking
    });
  } catch (error) {
    console.error('Team mood error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { mood, energy, notes } = await request.json();

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const team = await Team.findOne({ 'members.userId': user._id });
    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found" },
        { status: 404 }
      );
    }

    // Get today's mood entry or create a new one
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let todayMood = team.moodTracking.teamMood.find(
      m => new Date(m.date).getTime() === today.getTime()
    );

    if (!todayMood) {
      todayMood = {
        date: today,
        averageScore: 0,
        responses: []
      };
      team.moodTracking.teamMood.push(todayMood);
    }

    // Update or add user's response
    const existingResponse = todayMood.responses.find(
      r => r.userId.equals(user._id)
    );

    if (existingResponse) {
      existingResponse.mood = mood;
      existingResponse.energy = energy;
      existingResponse.notes = notes;
      existingResponse.timestamp = new Date();
    } else {
      todayMood.responses.push({
        userId: user._id,
        mood,
        energy,
        notes,
        timestamp: new Date()
      });
    }

    // Calculate new average score
    const moodScores = {
      great: 5,
      good: 4,
      okay: 3,
      tired: 2,
      stressed: 1
    };

    todayMood.averageScore = todayMood.responses.reduce(
      (acc, response) => acc + moodScores[response.mood as keyof typeof moodScores],
      0
    ) / todayMood.responses.length;

    // Generate insights if needed
    const lastWeekMoods = team.moodTracking.teamMood
      .filter(m => {
        const date = new Date(m.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date >= weekAgo;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (lastWeekMoods.length > 0) {
      const averageLastWeek = lastWeekMoods.reduce(
        (acc, day) => acc + day.averageScore,
        0
      ) / lastWeekMoods.length;

      if (todayMood.averageScore < averageLastWeek - 1) {
        team.moodTracking.insights.push({
          date: new Date(),
          type: 'alert',
          content: 'Team mood has significantly decreased today',
          severity: 'high'
        });
      } else if (todayMood.averageScore > averageLastWeek + 1) {
        team.moodTracking.insights.push({
          date: new Date(),
          type: 'trend',
          content: 'Team mood has significantly improved today',
          severity: 'low'
        });
      }
    }

    await team.save();

    return NextResponse.json({
      success: true,
      data: team.moodTracking
    });
  } catch (error) {
    console.error('Update team mood error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
} 
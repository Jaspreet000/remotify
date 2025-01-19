import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import FocusSession from '@/models/FocusSession';
import User from '@/models/User';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calculateRewards } from '@/lib/gamificationService';
import { nanoid } from 'nanoid';

interface Task {
  id: string;
  description: string;
  completed: boolean;
  completedAt?: Date;
}

// GET /api/focus/sessions - Get user's focus sessions
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const status = searchParams.get('status');

    const query = {
      userId: user._id,
      ...(status && { status })
    };

    const sessions = await FocusSession.find(query)
      .sort({ startTime: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await FocusSession.countDocuments(query);

    // Calculate statistics
    const stats = {
      totalSessions: total,
      averageFocusScore: sessions.reduce((acc, s) => acc + s.focusScore, 0) / sessions.length || 0,
      totalFocusTime: sessions.reduce((acc, s) => acc + s.duration, 0),
      completionRate: sessions.filter(s => s.status === 'completed').length / sessions.length * 100 || 0
    };

    return NextResponse.json({
      success: true,
      data: {
        sessions,
        stats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Focus Sessions Error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/focus/sessions - Start a new focus session
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
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check for active session
    const activeSession = await FocusSession.findOne({
      userId: user._id,
      status: 'active'
    });

    if (activeSession) {
      return NextResponse.json(
        { success: false, message: "You already have an active session" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      type = 'pomodoro',
      workDuration = 25,
      shortBreakDuration = 5,
      longBreakDuration = 15,
      sessionsUntilLongBreak = 4,
      blockedSites = [],
      soundEnabled = false,
      soundType,
      notificationsBlocked = true,
      tasks = []
    } = body;

    // Create new session
    const focusSession = await FocusSession.create({
      userId: user._id,
      startTime: new Date(),
      duration: workDuration,
      focusScore: 100, // Initial score
      type,
      status: 'active',
      tasks: tasks.map((task: string) => ({
        id: nanoid(),
        description: task,
        completed: false
      })),
      settings: {
        workDuration,
        shortBreakDuration,
        longBreakDuration,
        sessionsUntilLongBreak,
        blockedSites,
        soundEnabled,
        soundType,
        notificationsBlocked
      },
      metrics: {
        keystrokes: 0,
        mouseClicks: 0,
        mouseMovement: 0,
        tabSwitches: 0,
        noiseLevel: 0
      }
    });

    return NextResponse.json({
      success: true,
      data: focusSession
    });
  } catch (error) {
    console.error('Focus Session Start Error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/focus/sessions - Update current session
export async function PATCH(request: Request) {
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

    const body = await request.json();
    const {
      sessionId,
      action,
      data = {}
    } = body;

    const focusSession = await FocusSession.findOne({
      _id: sessionId,
      userId: user._id
    });

    if (!focusSession) {
      return NextResponse.json(
        { success: false, message: "Session not found" },
        { status: 404 }
      );
    }

    switch (action) {
      case 'complete':
        focusSession.status = 'completed';
        focusSession.endTime = new Date();
        
        // Calculate rewards
        const rewards = calculateRewards(
          focusSession.focusScore,
          focusSession.duration,
          user.stats.weeklyStreak || 0,
          user.activePowerUps || []
        );
        
        focusSession.rewards = rewards;
        
        // Update user stats
        user.stats.totalFocusTime = (user.stats.totalFocusTime || 0) + focusSession.duration;
        user.stats.xp = (user.stats.xp || 0) + rewards.xp;
        user.stats.coins = (user.stats.coins || 0) + rewards.coins;
        
        await user.save();
        break;

      case 'interrupt':
        focusSession.status = 'interrupted';
        focusSession.endTime = new Date();
        break;

      case 'update_metrics':
        Object.assign(focusSession.metrics, data.metrics);
        break;

      case 'add_distraction':
        focusSession.distractions.push({
          timestamp: new Date(),
          type: data.type,
          duration: data.duration
        });
        break;

      case 'add_break':
        focusSession.breaks.push({
          startTime: new Date(),
          endTime: new Date(Date.now() + data.duration * 60000),
          duration: data.duration,
          type: data.type
        });
        break;

      case 'update_task':
        const taskIndex = focusSession.tasks.findIndex((t: Task) => t.id === data.taskId);
        if (taskIndex !== -1) {
          focusSession.tasks[taskIndex].completed = data.completed;
          if (data.completed) {
            focusSession.tasks[taskIndex].completedAt = new Date();
          }
        }
        break;

      case 'add_note':
        focusSession.notes = data.notes;
        break;

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }

    await focusSession.save();

    return NextResponse.json({
      success: true,
      data: focusSession
    });
  } catch (error) {
    console.error('Focus Session Update Error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
} 
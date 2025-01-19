import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateDailyQuests, generateWeeklyQuests } from '@/lib/gamificationService';
import type { Quest } from "@/lib/gamificationService";

// GET /api/quests - Get user's active quests
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

    // Filter out expired quests
    const now = new Date();
    const activeQuests = (user.quests || []).filter(quest => {
      const expiresAt = new Date(quest.expiresAt);
      return expiresAt > now;
    });

    // Generate new quests if needed
    const dailyQuests = activeQuests.filter(q => q.type === 'daily');
    const weeklyQuests = activeQuests.filter(q => q.type === 'weekly');

    let newQuests = [];

    // Check if we need new daily quests
    if (dailyQuests.length === 0) {
      newQuests.push(...generateDailyQuests());
    }

    // Check if we need new weekly quests
    if (weeklyQuests.length === 0) {
      newQuests.push(...generateWeeklyQuests());
    }

    if (newQuests.length > 0) {
      user.quests = [...activeQuests, ...newQuests];
      await user.save();
    }

    return NextResponse.json({
      success: true,
      data: {
        quests: user.quests,
        stats: {
          dailyCompleted: user.stats.dailyQuestsCompleted || 0,
          weeklyCompleted: user.stats.weeklyQuestsCompleted || 0,
          questStreak: user.stats.questStreak || 0
        }
      }
    });
  } catch (error) {
    console.error('Quests Error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/quests/:id/claim - Claim rewards for a completed quest
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const { questId } = await request.json();
    if (!questId) {
      return NextResponse.json(
        { message: "Quest ID is required" },
        { status: 400 }
      );
    }

    // Initialize quests array if it doesn't exist
    if (!user.quests) {
      user.quests = [];
    }

    // Check if quest is already active
    const existingQuest = user.quests.find((q: Quest) => q.id === questId);
    if (existingQuest) {
      return NextResponse.json(
        { message: "Quest already active" },
        { status: 400 }
      );
    }

    // Add quest to user's active quests
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const newQuest: Quest = {
      id: questId,
      name: "New Quest",
      description: "Quest description",
      type: "daily",
      difficulty: "easy",
      conditions: [{
        type: "focus_time",
        target: 120,
        current: 0
      }],
      rewards: {
        xp: 100,
        coins: 50
      },
      startDate: now,
      endDate: tomorrow,
      status: "active"
    };

    user.quests.push(newQuest);
    await user.save();

    return NextResponse.json({ data: newQuest });
  } catch (error) {
    console.error("Error in quests API:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const { questId, progress } = await request.json();
    if (!questId || typeof progress !== 'number') {
      return NextResponse.json(
        { message: "Quest ID and progress are required" },
        { status: 400 }
      );
    }

    // Find the quest
    const quest = user.quests?.find((q: Quest) => q.id === questId);
    if (!quest) {
      return NextResponse.json(
        { message: "Quest not found" },
        { status: 404 }
      );
    }

    if (quest.status !== 'active') {
      return NextResponse.json(
        { message: "Quest is not active" },
        { status: 400 }
      );
    }

    // Update quest progress
    quest.conditions[0].current = progress;

    // Check if quest is completed
    if (progress >= quest.conditions[0].target) {
      quest.status = 'completed';
      
      // Award rewards
      user.stats.xp = (user.stats.xp || 0) + quest.rewards.xp;
      user.stats.coins = (user.stats.coins || 0) + quest.rewards.coins;
      
      // Handle achievement if any
      if (quest.rewards.achievement) {
        if (!user.achievements) {
          user.achievements = [];
        }
        
        if (!user.achievements.some(a => a.id === quest.rewards.achievement)) {
          user.achievements.push({
            id: quest.rewards.achievement,
            name: quest.name,
            description: quest.description,
            icon: quest.icon || '🏆',
            unlockedAt: new Date()
          });
        }
      }
    }

    await user.save();

    return NextResponse.json({
      data: {
        quest,
        stats: user.stats,
        achievements: user.achievements
      }
    });
  } catch (error) {
    console.error("Error in quests API:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 
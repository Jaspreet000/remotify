import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { generateDailyQuests, generateWeeklyQuests } from "@/lib/gamificationService";

interface Achievement {
  id: string;
  name: string;
  description?: string;
  unlockedAt?: Date;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    // Find user and initialize stats if they don't exist
    let user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Initialize stats if they don't exist
    if (!user.stats) {
      user.stats = {
        level: 1,
        xp: 0,
        coins: 0,
        totalFocusTime: 0,
        weeklyStreak: 0,
        averageSessionScore: 0
      };
      await user.save();
    }

    // Generate quests
    const dailyQuests = generateDailyQuests(user);
    const weeklyQuests = generateWeeklyQuests(user);

    // Filter out expired quests and combine daily and weekly quests
    const now = new Date();
    const activeQuests = [...dailyQuests, ...weeklyQuests].filter(
      quest => new Date(quest.endDate) > now
    );

    // Get user's rank (simplified version - you might want to implement a more sophisticated ranking system)
    const usersAhead = await User.countDocuments({
      'stats.totalFocusTime': { $gt: user.stats.totalFocusTime || 0 }
    });
    const leaderboardRank = usersAhead + 1;

    const response = {
      quests: activeQuests,
      powerUps: user.powerUps || [],
      stats: {
        level: user.stats.level || 1,
        xp: user.stats.xp || 0,
        coins: user.stats.coins || 0,
        totalFocusTime: user.stats.totalFocusTime || 0,
        weeklyStreak: user.stats.weeklyStreak || 0,
        achievements: user.achievements?.length || 0,
        leaderboardRank,
      },
      achievements: (user.achievements || []).map((achievement: Record<string, any> & { unlockedAt?: Date }) => ({
        ...achievement,
        unlockedAt: achievement.unlockedAt?.toISOString()
      })),
    };

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error("Error in gamification API:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 
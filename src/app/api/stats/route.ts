import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const XP_PER_LEVEL = 1000;
const LEVEL_MULTIPLIER = 1.5;

interface LevelInfo {
  level: number;
  currentXP: number;
  requiredXP: number;
  progress: number;
  nextRewards: {
    coins: number;
    powerUp?: string;
  };
}

function calculateLevelInfo(totalXP: number): LevelInfo {
  let level = 1;
  let xpForNextLevel = XP_PER_LEVEL;
  let accumulatedXP = 0;

  while (totalXP >= accumulatedXP + xpForNextLevel) {
    accumulatedXP += xpForNextLevel;
    level++;
    xpForNextLevel = Math.round(XP_PER_LEVEL * Math.pow(LEVEL_MULTIPLIER, level - 1));
  }

  const currentXP = totalXP - accumulatedXP;
  const requiredXP = xpForNextLevel;
  const progress = (currentXP / requiredXP) * 100;

  // Define rewards for next level
  const nextRewards = {
    coins: level * 100
  };

  // Special power-up rewards at milestone levels
  if (level + 1 === 5) {
    nextRewards.powerUp = 'xp_boost_small';
  } else if (level + 1 === 10) {
    nextRewards.powerUp = 'coin_boost_small';
  } else if (level + 1 === 15) {
    nextRewards.powerUp = 'xp_boost_large';
  } else if (level + 1 === 20) {
    nextRewards.powerUp = 'coin_boost_large';
  } else if (level + 1 === 25) {
    nextRewards.powerUp = 'all_boost';
  }

  return {
    level,
    currentXP,
    requiredXP,
    progress,
    nextRewards
  };
}

// GET /api/stats - Get user's stats and level info
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

    const levelInfo = calculateLevelInfo(user.stats.xp || 0);

    // Calculate achievement completion rate
    const totalAchievements = 10; // Update this as you add more achievements
    const completedAchievements = user.achievements?.length || 0;
    const achievementRate = Math.round((completedAchievements / totalAchievements) * 100);

    // Calculate quest completion rate
    const dailyQuestsCompleted = user.stats.dailyQuestsCompleted || 0;
    const weeklyQuestsCompleted = user.stats.weeklyQuestsCompleted || 0;
    const totalQuestsCompleted = dailyQuestsCompleted + weeklyQuestsCompleted;

    // Calculate focus score trend
    const recentSessions = user.workSessions?.slice(-5) || [];
    const focusScores = recentSessions.map(session => session.focusScore);
    const averageFocusScore = focusScores.length > 0
      ? Math.round(focusScores.reduce((a, b) => a + b, 0) / focusScores.length)
      : 0;

    const focusTrend = focusScores.length >= 2
      ? focusScores[focusScores.length - 1] > focusScores[focusScores.length - 2]
        ? 'increasing'
        : focusScores[focusScores.length - 1] < focusScores[focusScores.length - 2]
          ? 'decreasing'
          : 'stable'
      : 'stable';

    return NextResponse.json({
      success: true,
      data: {
        level: levelInfo,
        stats: {
          totalFocusTime: user.stats.totalFocusTime || 0,
          averageSessionScore: user.stats.averageSessionScore || 0,
          weeklyStreak: user.stats.weeklyStreak || 0,
          questStreak: user.stats.questStreak || 0,
          coins: user.stats.coins || 0,
          achievementRate,
          totalQuestsCompleted,
          averageFocusScore,
          focusTrend
        },
        recentActivity: {
          sessions: recentSessions,
          achievements: user.achievements?.slice(-3) || [],
          quests: user.quests?.filter(q => !q.claimed && q.completed).slice(-3) || []
        }
      }
    });
  } catch (error) {
    console.error('Stats Error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/stats/level-up - Handle level up rewards
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

    const levelInfo = calculateLevelInfo(user.stats.xp || 0);

    // Award level up rewards
    const rewards = {
      coins: levelInfo.level * 100,
      powerUp: undefined as string | undefined
    };

    // Add coins
    user.stats.coins = (user.stats.coins || 0) + rewards.coins;

    // Check for power-up reward
    if (levelInfo.level === 5) {
      rewards.powerUp = 'xp_boost_small';
    } else if (levelInfo.level === 10) {
      rewards.powerUp = 'coin_boost_small';
    } else if (levelInfo.level === 15) {
      rewards.powerUp = 'xp_boost_large';
    } else if (levelInfo.level === 20) {
      rewards.powerUp = 'coin_boost_large';
    } else if (levelInfo.level === 25) {
      rewards.powerUp = 'all_boost';
    }

    // Add power-up to inventory if awarded
    if (rewards.powerUp) {
      user.inventory.powerUps = [
        ...(user.inventory.powerUps || []),
        {
          id: rewards.powerUp,
          purchasedAt: new Date()
        }
      ];
    }

    await user.save();

    return NextResponse.json({
      success: true,
      data: {
        rewards,
        stats: {
          level: levelInfo.level,
          coins: user.stats.coins
        }
      }
    });
  } catch (error) {
    console.error('Level Up Error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
} 
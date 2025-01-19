import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calculateRewards } from '@/lib/gamificationService';

// POST /api/sessions/complete - Complete a work session and award rewards
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

    const body = await request.json();
    const { focusScore, duration } = body;

    if (typeof focusScore !== 'number' || typeof duration !== 'number') {
      return NextResponse.json(
        { success: false, message: "Invalid focus score or duration" },
        { status: 400 }
      );
    }

    // Get active power-ups
    await user.checkPowerUps();
    const activePowerUps = user.activePowerUps || [];

    // Calculate rewards
    const rewards = calculateRewards(
      focusScore,
      duration,
      user.stats.weeklyStreak || 0,
      activePowerUps
    );

    // Update user stats
    user.stats.totalFocusTime = (user.stats.totalFocusTime || 0) + duration;
    user.stats.averageSessionScore = Math.round(
      ((user.stats.averageSessionScore || 0) * (user.workSessions?.length || 0) + focusScore) /
      ((user.workSessions?.length || 0) + 1)
    );

    // Update streak
    const lastActive = user.stats.lastActive ? new Date(user.stats.lastActive) : new Date(0);
    const today = new Date();
    const isConsecutiveDay = 
      lastActive.toDateString() === new Date(today.getTime() - 86400000).toDateString();
    
    if (isConsecutiveDay) {
      user.stats.weeklyStreak = (user.stats.weeklyStreak || 0) + 1;
    } else if (lastActive.toDateString() !== today.toDateString()) {
      user.stats.weeklyStreak = 1;
    }
    user.stats.lastActive = today;

    // Award XP and coins
    const leveledUp = await user.addXP(rewards.xp);
    await user.addCoins(rewards.coins);

    // Update quest progress
    const questsUpdated = await user.checkQuestProgress();

    // Create notifications
    const notifications = [];
    if (leveledUp) {
      notifications.push({
        type: 'level_up',
        message: `Congratulations! You've reached level ${user.stats.level}!`,
        rewards: {
          coins: user.stats.level * 100
        }
      });
    }

    if (user.stats.weeklyStreak % 5 === 0) {
      notifications.push({
        type: 'streak',
        message: `Amazing! You've maintained a ${user.stats.weeklyStreak} day streak!`,
        rewards: {
          xp: user.stats.weeklyStreak * 10,
          coins: user.stats.weeklyStreak * 5
        }
      });
    }

    // Check for achievements
    const achievements = user.achievements || [];
    const newAchievements = [];

    // Focus Time Achievement
    if (user.stats.totalFocusTime >= 3600 && !achievements.some((a: { id: string }) => a.id === 'focus_master')) {
      newAchievements.push({
        id: 'focus_master',
        name: 'Focus Master',
        description: 'Complete 60 minutes of focused work',
        icon: '⏱️',
        unlockedAt: new Date(),
        rewards: {
          xp: 500,
          badge: 'focus_master',
          title: 'The Focused'
        }
      });
    }

    // Streak Achievement
    if (user.stats.weeklyStreak >= 7 && !achievements.some((a: { id: string }) => a.id === 'streak_warrior')) {
      newAchievements.push({
        id: 'streak_warrior',
        name: 'Streak Warrior',
        description: 'Maintain a 7-day focus streak',
        icon: '🔥',
        unlockedAt: new Date(),
        rewards: {
          xp: 1000,
          badge: 'streak_warrior',
          title: 'The Consistent'
        }
      });
    }

    // High Score Achievement
    if (focusScore >= 95 && !achievements.some((a: { id: string }) => a.id === 'perfectionist')) {
      newAchievements.push({
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Complete a session with 95%+ focus score',
        icon: '🎯',
        unlockedAt: new Date(),
        rewards: {
          xp: 750,
          badge: 'perfectionist',
          title: 'The Precise'
        }
      });
    }

    if (newAchievements.length > 0) {
      user.achievements = [...achievements, ...newAchievements];
      notifications.push(...newAchievements.map(achievement => ({
        type: 'achievement',
        message: `New Achievement Unlocked: ${achievement.name}!`,
        achievement
      })));

      // Award achievement rewards
      for (const achievement of newAchievements) {
        await user.addXP(achievement.rewards.xp);
        if (achievement.rewards.title) {
          user.inventory.titles = [...(user.inventory.titles || []), achievement.rewards.title];
        }
        if (achievement.rewards.badge) {
          user.inventory.badges = [...(user.inventory.badges || []), achievement.rewards.badge];
        }
      }
    }

    await user.save();

    return NextResponse.json({
      success: true,
      data: {
        rewards,
        stats: user.stats,
        leveledUp,
        questsUpdated,
        newAchievements,
        notifications
      }
    });
  } catch (error) {
    console.error('Session Completion Error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
} 
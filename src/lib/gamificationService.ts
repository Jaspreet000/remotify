import { IUser } from '@/models/User';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiredLevel?: number;
  requiredScore?: number;
  conditions: {
    type: 'focus_time' | 'streak' | 'challenges' | 'collaboration' | 'custom';
    target: number;
    current: number;
  }[];
  rewards: {
    xp: number;
    badge?: string;
    title?: string;
    specialPower?: string;
  };
  unlockedAt?: Date;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  difficulty: 'easy' | 'medium' | 'hard';
  icon?: string;
  conditions: {
    type: 'focus_time' | 'streak' | 'challenges' | 'collaboration' | 'custom';
    target: number;
    current: number;
  }[];
  rewards: {
    xp: number;
    coins: number;
    achievement?: string;
  };
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'failed';
  claimed?: boolean;
}

export interface PowerUp {
  id: string;
  name: string;
  description: string;
  type: 'boost' | 'shield' | 'multiplier';
  effect: {
    type: 'xp' | 'coins' | 'focus_score';
    multiplier: number;
    duration: number; // in minutes
  };
  cost: number;
  cooldown: number; // in minutes
  lastUsed?: Date;
  expiresAt?: Date;
}

export interface Rewards {
  xp: number;
  coins: number;
}

export const XP_PER_LEVEL = 1000;
export const LEVEL_MULTIPLIER = 1.5;

export function calculateLevel(xp: number): number {
  return Math.floor(Math.pow(xp / XP_PER_LEVEL, 1 / LEVEL_MULTIPLIER)) + 1;
}

export function calculateXPForLevel(level: number): number {
  return Math.floor(XP_PER_LEVEL * Math.pow(level - 1, LEVEL_MULTIPLIER));
}

export function calculateXPProgress(xp: number): number {
  const currentLevel = calculateLevel(xp);
  const currentLevelXP = calculateXPForLevel(currentLevel);
  const nextLevelXP = calculateXPForLevel(currentLevel + 1);
  return ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
}

export function awardXP(currentXP: number, amount: number): { newXP: number; leveledUp: boolean } {
  const oldLevel = calculateLevel(currentXP);
  const newXP = currentXP + amount;
  const newLevel = calculateLevel(newXP);
  return {
    newXP,
    leveledUp: newLevel > oldLevel
  };
}

export function checkAchievementProgress(user: IUser, achievement: Achievement): number {
  let totalProgress = 0;
  
  achievement.conditions.forEach(condition => {
    let progress = 0;
    switch (condition.type) {
      case 'focus_time':
        progress = (user.stats.totalFocusTime / condition.target) * 100;
        break;
      case 'streak':
        progress = (user.stats.weeklyStreak / condition.target) * 100;
        break;
      case 'challenges':
        const completedChallenges = user.achievements.length;
        progress = (completedChallenges / condition.target) * 100;
        break;
      case 'collaboration':
        // Assuming there's a collaboration score in user stats
        const collaborationScore = user.stats.averageSessionScore;
        progress = (collaborationScore / condition.target) * 100;
        break;
    }
    totalProgress += progress / achievement.conditions.length;
  });

  return Math.min(Math.round(totalProgress), 100);
}

export function generateDailyQuests(user: IUser): Quest[] {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const quests: Quest[] = [
    {
      id: `daily-focus-${now.toISOString().split('T')[0]}`,
      name: 'Daily Focus Challenge',
      description: 'Complete 2 hours of focused work today',
      type: 'daily',
      difficulty: 'easy',
      icon: '⏱️',
      conditions: [{
        type: 'focus_time',
        target: 120, // 2 hours in minutes
        current: 0
      }],
      rewards: {
        xp: 100,
        coins: 50
      },
      startDate: now,
      endDate: tomorrow,
      status: 'active'
    },
    {
      id: `daily-streak-${now.toISOString().split('T')[0]}`,
      name: 'Consistency Champion',
      description: 'Maintain a focus score above 80% for all sessions today',
      type: 'daily',
      difficulty: 'medium',
      icon: '🎯',
      conditions: [{
        type: 'streak',
        target: 80,
        current: 0
      }],
      rewards: {
        xp: 150,
        coins: 75
      },
      startDate: now,
      endDate: tomorrow,
      status: 'active'
    }
  ];

  // Add a special quest if user is on a streak
  const weeklyStreak = user.stats?.weeklyStreak || 0;
  if (weeklyStreak >= 5) {
    quests.push({
      id: `daily-special-${now.toISOString().split('T')[0]}`,
      name: 'Streak Master',
      description: 'Complete 3 focus sessions with 90%+ focus score',
      type: 'daily',
      difficulty: 'hard',
      icon: '🔥',
      conditions: [{
        type: 'streak',
        target: 90,
        current: 0
      }],
      rewards: {
        xp: 250,
        coins: 100,
        achievement: 'streak_master'
      },
      startDate: now,
      endDate: tomorrow,
      status: 'active'
    });
  }

  return quests;
}

export function generateWeeklyQuests(user: IUser): Quest[] {
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));
  weekEnd.setHours(23, 59, 59, 999);

  return [
    {
      id: `weekly-focus-${now.toISOString().split('T')[0]}`,
      name: 'Weekly Focus Master',
      description: 'Complete 10 hours of focused work this week',
      type: 'weekly',
      difficulty: 'medium',
      icon: '⭐',
      conditions: [{
        type: 'focus_time',
        target: 600, // 10 hours in minutes
        current: 0
      }],
      rewards: {
        xp: 500,
        coins: 250,
        achievement: 'weekly_master'
      },
      startDate: now,
      endDate: weekEnd,
      status: 'active'
    },
    {
      id: `weekly-collaboration-${now.toISOString().split('T')[0]}`,
      name: 'Team Player',
      description: 'Participate in 3 team challenges',
      type: 'weekly',
      difficulty: 'hard',
      icon: '👥',
      conditions: [{
        type: 'collaboration',
        target: 3,
        current: 0
      }],
      rewards: {
        xp: 750,
        coins: 375,
        achievement: 'team_player'
      },
      startDate: now,
      endDate: weekEnd,
      status: 'active'
    }
  ];
}

export const POWER_UPS: PowerUp[] = [
  {
    id: 'double_xp',
    name: 'Double XP',
    description: 'Double all XP earned for 30 minutes',
    type: 'multiplier',
    effect: {
      type: 'xp',
      multiplier: 2,
      duration: 30
    },
    cost: 1000,
    cooldown: 120
  },
  {
    id: 'focus_shield',
    name: 'Focus Shield',
    description: 'Maintain minimum 80% focus score for 1 hour',
    type: 'shield',
    effect: {
      type: 'focus_score',
      multiplier: 1.2,
      duration: 60
    },
    cost: 750,
    cooldown: 90
  },
  {
    id: 'coin_boost',
    name: 'Coin Boost',
    description: 'Earn 50% more coins for 1 hour',
    type: 'boost',
    effect: {
      type: 'coins',
      multiplier: 1.5,
      duration: 60
    },
    cost: 500,
    cooldown: 60
  }
];

export function canUsePowerUp(powerUp: PowerUp): boolean {
  if (!powerUp.lastUsed) return true;
  
  const now = new Date();
  const cooldownEnd = new Date(powerUp.lastUsed);
  cooldownEnd.setMinutes(cooldownEnd.getMinutes() + powerUp.cooldown);
  
  return now >= cooldownEnd;
}

export function calculateRewards(
  focusScore: number,
  duration: number,
  streak: number,
  activePowerUps: PowerUp[]
): Rewards {
  // Base rewards
  let xp = Math.round((focusScore / 100) * (duration / 60) * 10); // 10 XP per minute at 100% focus
  let coins = Math.round((focusScore / 100) * (duration / 60) * 5); // 5 coins per minute at 100% focus

  // Streak bonus (up to 50% bonus)
  const streakBonus = Math.min(streak * 0.1, 0.5);
  xp = Math.round(xp * (1 + streakBonus));
  coins = Math.round(coins * (1 + streakBonus));

  // Focus score bonuses
  if (focusScore >= 95) {
    xp += 50; // Bonus for excellent focus
    coins += 25;
  } else if (focusScore >= 85) {
    xp += 25; // Bonus for good focus
    coins += 15;
  }

  // Duration milestones
  if (duration >= 3600) { // 1 hour
    xp += 100;
    coins += 50;
  } else if (duration >= 1800) { // 30 minutes
    xp += 50;
    coins += 25;
  }

  // Apply power-up multipliers
  for (const powerUp of activePowerUps) {
    if (powerUp.type === 'xp_boost') {
      xp = Math.round(xp * powerUp.multiplier);
    } else if (powerUp.type === 'coin_boost') {
      coins = Math.round(coins * powerUp.multiplier);
    } else if (powerUp.type === 'all_boost') {
      xp = Math.round(xp * powerUp.multiplier);
      coins = Math.round(coins * powerUp.multiplier);
    }
  }

  return { xp, coins };
} 
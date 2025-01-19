import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User, { IUser } from '@/models/User';
import Team, { ITeam } from '@/models/Team';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPersonalizedRecommendations, analyzeUserPerformance, generateTeamInsights } from '@/lib/aiService';

interface LeaderboardEntry {
  userId: string;
  name: string;
  avatar: string;
  score: number;
  rank: number;
  badges: string[];
  recentAchievements: string[];
  performanceInsights: {
    strengths: string[];
    improvements: string[];
    consistency: number;
    trend: 'rising' | 'stable' | 'declining';
  };
  focusMetrics: {
    totalFocusTime: number;
    averageSessionScore: number;
    weeklyImprovement: number;
    consistencyScore: number;
    collaborationScore: number;
  };
  specializations: string[];
  level: number;
  experience: number;
  teamInfo?: {
    name: string;
    rank: number;
    score: number;
  };
}

interface TeamLeaderboardEntry {
  teamId: string;
  name: string;
  memberCount: number;
  score: number;
  rank: number;
  achievements: Array<{
    id: string;
    name: string;
    unlockedAt: Date;
  }>;
  stats: {
    totalFocusTime: number;
    averageProductivity: number;
    weeklyStreak: number;
    collaborationScore: number;
  };
  activeChallenge?: {
    name: string;
    progress: number;
    target: number;
    endDate: Date;
  };
}

interface LeaderboardResponse {
  topPerformers: LeaderboardEntry[];
  userRank: LeaderboardEntry;
  nearbyUsers: LeaderboardEntry[];
  teamLeaderboard: {
    topTeams: TeamLeaderboardEntry[];
    userTeam?: TeamLeaderboardEntry;
    nearbyTeams: TeamLeaderboardEntry[];
  };
  globalStats: {
    totalUsers: number;
    averageScore: number;
    topSpecializations: { name: string; count: number }[];
    mostActiveTime: string;
    competitionInsights: string[];
  };
  weeklyHighlights: {
    mostImproved: { name: string; improvement: number }[];
    longestStreak: { name: string; days: number }[];
    bestCollaborators: { name: string; score: number }[];
  };
  activeChallenge?: {
    id: string;
    name: string;
    description: string;
    progress: number;
    target: number;
    endDate: Date;
    leaderboard: Array<{
      name: string;
      progress: number;
      isUser?: boolean;
    }>;
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get current user and their team
    const currentUser = await User.findOne({ email: session.user.email }).lean();
    const userTeam = currentUser?.teamCode 
      ? await Team.findOne({ code: currentUser.teamCode }).lean()
      : null;

    // Get all users with their work sessions and habit analysis
    const users = await User.find({})
      .select('name email profile workSessions habitAnalysis teamCode')
      .lean();

    // Get all teams
    const teams = await Team.find({}).lean();

    // Calculate scores and create leaderboard entries
    const leaderboardEntries = await Promise.all(users.map(async (user) => {
      const focusMetrics = calculateFocusMetrics(user.workSessions || []);
      const performanceInsights = await analyzeUserPerformance(user);
      const level = calculateUserLevel(focusMetrics, user.workSessions?.length || 0);
      
      // Find user's team info
      const userTeamInfo = user.teamCode ? teams.find(t => t.code === user.teamCode) : null;
      
      return {
        userId: user._id.toString(),
        name: user.name,
        avatar: user.profile.avatar,
        score: calculateOverallScore(focusMetrics, performanceInsights),
        badges: determineUserBadges(focusMetrics, performanceInsights),
        recentAchievements: getRecentAchievements(user),
        performanceInsights,
        focusMetrics,
        specializations: determineSpecializations(user),
        level,
        experience: calculateExperience(focusMetrics, level),
        teamInfo: userTeamInfo ? {
          name: userTeamInfo.name,
          rank: userTeamInfo.leaderboard.weeklyRank,
          score: userTeamInfo.leaderboard.weeklyScore
        } : undefined
      };
    }));

    // Process team leaderboard
    const teamLeaderboardEntries = teams.map((team): TeamLeaderboardEntry => ({
      teamId: team._id.toString(),
      name: team.name,
      memberCount: team.members.length,
      score: team.leaderboard.weeklyScore,
      rank: team.leaderboard.weeklyRank,
      achievements: team.achievements,
      stats: team.stats,
      activeChallenge: team.challenges.find(c => c.status === 'active')
    }));

    // Sort entries and assign ranks
    const sortedEntries = leaderboardEntries
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    const sortedTeams = teamLeaderboardEntries
      .sort((a, b) => b.score - a.score)
      .map((team, index) => ({ ...team, rank: index + 1 }));

    // Find current user's position
    const currentUserIndex = sortedEntries.findIndex(
      entry => entry.userId === session.user.id
    );
    const userRank = sortedEntries[currentUserIndex];

    // Get nearby users
    const nearbyUsers = sortedEntries.slice(
      Math.max(0, currentUserIndex - 3),
      Math.min(sortedEntries.length, currentUserIndex + 4)
    );

    // Get team leaderboard data
    const userTeamIndex = userTeam 
      ? sortedTeams.findIndex(team => team.teamId === userTeam._id.toString())
      : -1;

    const teamLeaderboard = {
      topTeams: sortedTeams.slice(0, 5),
      userTeam: userTeamIndex >= 0 ? sortedTeams[userTeamIndex] : undefined,
      nearbyTeams: userTeamIndex >= 0 
        ? sortedTeams.slice(
            Math.max(0, userTeamIndex - 2),
            Math.min(sortedTeams.length, userTeamIndex + 3)
          )
        : []
    };

    // Get active challenge if any
    const activeChallenge = userTeam?.challenges.find(c => c.status === 'active');
    const challengeLeaderboard = activeChallenge 
      ? await calculateChallengeLeaderboard(activeChallenge, users)
      : undefined;

    // Calculate global stats and highlights
    const globalStats = calculateGlobalStats(sortedEntries, sortedTeams);
    const weeklyHighlights = calculateWeeklyHighlights(sortedEntries);

    const response: LeaderboardResponse = {
      topPerformers: sortedEntries.slice(0, 10),
      userRank,
      nearbyUsers,
      teamLeaderboard,
      globalStats,
      weeklyHighlights,
      activeChallenge: challengeLeaderboard
    };

    return NextResponse.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Leaderboard API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateFocusMetrics(workSessions: any[]) {
  const recentSessions = workSessions.slice(-30);
  const weekSessions = workSessions.slice(-7);
  const prevWeekSessions = workSessions.slice(-14, -7);

  const totalFocusTime = recentSessions.reduce((sum, session) => sum + session.duration, 0);
  const averageSessionScore = recentSessions.reduce((sum, session) => sum + (session.focusScore || 0), 0) / recentSessions.length || 0;
  
  const weeklyAvg = weekSessions.reduce((sum, session) => sum + (session.focusScore || 0), 0) / weekSessions.length || 0;
  const prevWeeklyAvg = prevWeekSessions.reduce((sum, session) => sum + (session.focusScore || 0), 0) / prevWeekSessions.length || 0;
  const weeklyImprovement = ((weeklyAvg - prevWeeklyAvg) / prevWeeklyAvg) * 100;

  const consistencyScore = calculateConsistencyScore(workSessions);
  const collaborationScore = calculateCollaborationScore(workSessions);

  return {
    totalFocusTime,
    averageSessionScore,
    weeklyImprovement,
    consistencyScore,
    collaborationScore
  };
}

function calculateConsistencyScore(workSessions: any[]) {
  const dailySessions = new Map<string, number>();
  workSessions.forEach(session => {
    const date = new Date(session.startTime).toDateString();
    dailySessions.set(date, (dailySessions.get(date) || 0) + 1);
  });

  const daysWithSessions = dailySessions.size;
  const totalDays = 30;
  const avgSessionsPerDay = workSessions.length / daysWithSessions;
  const consistencyScore = (daysWithSessions / totalDays) * 100 * (Math.min(avgSessionsPerDay, 4) / 4);

  return Math.min(consistencyScore, 100);
}

function calculateCollaborationScore(workSessions: any[]) {
  // This would be enhanced with actual collaboration data
  // For now, return a placeholder score
  return 75;
}

function calculateOverallScore(focusMetrics: any, performanceInsights: any) {
  const weights = {
    totalFocusTime: 0.2,
    averageSessionScore: 0.2,
    weeklyImprovement: 0.15,
    consistencyScore: 0.25,
    collaborationScore: 0.2
  };

  return Math.round(
    focusMetrics.totalFocusTime / 60 * weights.totalFocusTime +
    focusMetrics.averageSessionScore * weights.averageSessionScore +
    Math.min(Math.max(focusMetrics.weeklyImprovement, 0), 100) * weights.weeklyImprovement +
    focusMetrics.consistencyScore * weights.consistencyScore +
    focusMetrics.collaborationScore * weights.collaborationScore
  );
}

function determineUserBadges(focusMetrics: any, performanceInsights: any) {
  const badges = [];

  if (focusMetrics.totalFocusTime > 3000) badges.push('Focus Master');
  if (focusMetrics.averageSessionScore > 90) badges.push('Productivity Elite');
  if (focusMetrics.consistencyScore > 85) badges.push('Consistency King');
  if (focusMetrics.weeklyImprovement > 20) badges.push('Rising Star');
  if (focusMetrics.collaborationScore > 80) badges.push('Team Player');

  return badges;
}

function getRecentAchievements(user: any) {
  const achievements = [];
  const recentSessions = user.workSessions?.slice(-7) || [];

  if (recentSessions.length >= 5) {
    achievements.push('Completed 5+ sessions this week');
  }

  const averageScore = recentSessions.reduce((sum: number, session: any) => sum + (session.focusScore || 0), 0) / recentSessions.length;
  if (averageScore > 85) {
    achievements.push('Maintained 85%+ focus score this week');
  }

  return achievements;
}

function determineSpecializations(user: any) {
  // This would be enhanced with actual user data analysis
  return ['Deep Work', 'Team Collaboration', 'Consistent Performance'];
}

function calculateUserLevel(focusMetrics: any, totalSessions: number) {
  const baseXP = totalSessions * 100;
  const bonusXP = focusMetrics.totalFocusTime / 60 * 10;
  const totalXP = baseXP + bonusXP;
  
  return Math.floor(Math.sqrt(totalXP) / 10) + 1;
}

function calculateExperience(focusMetrics: any, currentLevel: number) {
  const baseXP = focusMetrics.totalFocusTime / 60 * 10;
  const levelThreshold = Math.pow(currentLevel * 10, 2);
  
  return Math.round((baseXP / levelThreshold) * 100);
}

function calculateGlobalStats(users: LeaderboardEntry[], teams: TeamLeaderboardEntry[]) {
  const totalUsers = users.length;
  const averageScore = users.reduce((sum, user) => sum + user.score, 0) / totalUsers;

  const specializationCounts = new Map<string, number>();
  users.forEach(user => {
    user.specializations.forEach(spec => {
      specializationCounts.set(spec, (specializationCounts.get(spec) || 0) + 1);
    });
  });

  const topSpecializations = Array.from(specializationCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate most active time based on session data
  const mostActiveTime = calculateMostActiveTime(users);

  // Generate competition insights using team data
  const competitionInsights = generateCompetitionInsights(users, teams);

  return {
    totalUsers,
    averageScore,
    topSpecializations,
    mostActiveTime,
    competitionInsights
  };
}

function calculateMostActiveTime(users: LeaderboardEntry[]) {
  // Implement logic to find the most common active time
  // For now, return a placeholder
  return "2 PM - 4 PM";
}

function generateCompetitionInsights(users: LeaderboardEntry[], teams: TeamLeaderboardEntry[]) {
  const insights = [];

  // Add team-based insights
  if (teams.length > 0) {
    const topTeam = teams[0];
    insights.push(`Team ${topTeam.name} is leading with ${topTeam.score} points`);
  }

  // Add specialization insights
  const specializations = users.flatMap(user => user.specializations);
  const topSpec = getMostFrequent(specializations);
  if (topSpec) {
    insights.push(`${topSpec} specialists are leading this week`);
  }

  // Add trend insights
  const risingUsers = users.filter(user => user.performanceInsights.trend === 'rising');
  if (risingUsers.length > 0) {
    insights.push(`${risingUsers.length} users showing improved performance`);
  }

  return insights;
}

function getMostFrequent<T>(arr: T[]): T | undefined {
  return arr.length > 0
    ? arr.reduce(
        (a, b, _, arr) =>
          (arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b),
        arr[0]
      )
    : undefined;
}

async function calculateChallengeLeaderboard(challenge: any, users: any[]) {
  const participants = users.filter(user => 
    challenge.participants.includes(user._id)
  );

  const leaderboard = participants.map(user => ({
    name: user.name,
    progress: calculateUserChallengeProgress(user, challenge),
    isUser: user._id.toString() === challenge.userId
  })).sort((a, b) => b.progress - a.progress);

  return {
    id: challenge.id,
    name: challenge.name,
    description: challenge.description,
    progress: challenge.progress,
    target: challenge.target,
    endDate: challenge.endDate,
    leaderboard
  };
}

function calculateUserChallengeProgress(user: any, challenge: any) {
  // This would be customized based on the challenge type
  // For now, return a simple progress calculation
  return Math.min(
    (user.workSessions?.length || 0) / challenge.target * 100,
    100
  );
}

function calculateWeeklyHighlights(entries: LeaderboardEntry[]) {
  const mostImproved = entries
    .filter(entry => entry.focusMetrics.weeklyImprovement > 0)
    .sort((a, b) => b.focusMetrics.weeklyImprovement - a.focusMetrics.weeklyImprovement)
    .slice(0, 3)
    .map(entry => ({
      name: entry.name,
      improvement: Math.round(entry.focusMetrics.weeklyImprovement)
    }));

  const longestStreak = entries
    .sort((a, b) => b.focusMetrics.consistencyScore - a.focusMetrics.consistencyScore)
    .slice(0, 3)
    .map(entry => ({
      name: entry.name,
      days: Math.round(entry.focusMetrics.consistencyScore / 10)
    }));

  const bestCollaborators = entries
    .sort((a, b) => b.focusMetrics.collaborationScore - a.focusMetrics.collaborationScore)
    .slice(0, 3)
    .map(entry => ({
      name: entry.name,
      score: entry.focusMetrics.collaborationScore
    }));

  return {
    mostImproved,
    longestStreak,
    bestCollaborators
  };
}

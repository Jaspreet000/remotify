import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Team from "@/models/Team";
import User from "@/models/User";
import mongoose from "mongoose";
import { generateTeamInsights } from "@/lib/aiService";
import FocusSession from "@/models/FocusSession";

interface TimeRange {
  start: Date;
  end: Date;
}

interface ProductivityMetrics {
  focusScore: number;
  totalTime: number;
  sessionsCompleted: number;
  averageSessionLength: number;
  longestStreak: number;
  distractionRate: number;
  completionRate: number;
}

interface TrendAnalysis {
  trend: 'improving' | 'stable' | 'declining';
  changePercentage: number;
  insights: string[];
}

interface UserDocument {
  _id: any;
  teamCode?: string;
  email: string;
  workSessions?: any[];
  name?: string;
  profile?: {
    avatar?: string;
  };
}

interface TeamDocument {
  code: string;
  members: Array<{
    userId: UserDocument;
  }>;
  challenges?: Array<{
    status: string;
  }>;
  averageProductivity: number;
}

export async function GET(request: Request) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'week';
    const view = searchParams.get('view') || 'personal';

    // First find the user
    const user = (await User.findOne({ email: session.user.email }).lean()) as unknown as UserDocument;

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Then fetch their work sessions separately
    const workSessions = await FocusSession.find({
      userId: user._id
    }).lean();

    // Attach the sessions to the user object
    const userWithSessions: UserDocument = {
      ...user,
      workSessions
    };

    const timeRange = getTimeRange(timeframe);
    const personalMetrics = await calculatePersonalMetrics(userWithSessions, timeRange);
    const productivityTrends = analyzeProductivityTrends(userWithSessions, timeRange);
    
    let teamMetrics = null;
    let teamInsights = null;
    let teamWithSessions: TeamDocument | null = null;
    
    if (view === 'team' && userWithSessions.teamCode) {
      // First find the team and its members
      const teamDoc = await Team.findOne({ code: userWithSessions.teamCode })
        .populate('members.userId', 'name email profile.avatar')
        .lean();
        
      if (teamDoc) {
        const teamData = teamDoc as unknown as TeamDocument;
        
        // Then fetch work sessions for all team members
        const teamMemberIds = teamData.members.map(m => m.userId._id);
        const allTeamSessions = await FocusSession.find({
          userId: { $in: teamMemberIds }
        }).lean();

        // Attach sessions to respective team members
        teamWithSessions = {
          ...teamData,
          members: teamData.members.map(member => ({
            ...member,
            userId: {
              ...member.userId,
              workSessions: allTeamSessions.filter(s => 
                s.userId.toString() === member.userId._id.toString()
              )
            }
          })),
          averageProductivity: calculateTeamProductivity(allTeamSessions)
        };

        if (teamWithSessions) {
          teamMetrics = await calculateTeamMetrics(teamWithSessions, timeRange);
          teamInsights = await generateTeamInsights(teamWithSessions);
        }
      }
    }

    // Calculate advanced metrics
    const peakPerformance = calculatePeakPerformanceTimes(workSessions);
    const habitPatterns = analyzeHabitPatterns(workSessions);
    const productivityScore = calculateProductivityScore(personalMetrics);
    const focusQuality = analyzeFocusQuality(workSessions);
    const achievementProgress = calculateAchievementProgress(userWithSessions);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          productivityScore,
          focusHours: personalMetrics.totalTime / 60,
          completedSessions: personalMetrics.sessionsCompleted,
          averageFocusScore: personalMetrics.focusScore,
          currentStreak: personalMetrics.longestStreak,
          completionRate: personalMetrics.completionRate
        },
        trends: {
          productivity: productivityTrends,
          focusQuality: focusQuality,
          habitStrength: habitPatterns.strength,
          consistencyScore: habitPatterns.consistencyScore
        },
        patterns: {
          peakHours: peakPerformance.hours,
          optimalDuration: peakPerformance.optimalDuration,
          preferredEnvironment: habitPatterns.environment,
          breakPatterns: habitPatterns.breaks
        },
        achievements: {
          current: achievementProgress.current,
          next: achievementProgress.next,
          recentUnlocks: achievementProgress.recent,
          progress: achievementProgress.progressMap
        },
        insights: {
          strengths: productivityTrends.insights,
          improvements: generateImprovementSuggestions(personalMetrics),
          milestones: calculateNextMilestones(personalMetrics),
          predictions: generateProductivityPredictions(productivityTrends)
        },
        team: teamMetrics && teamInsights && teamWithSessions ? {
          comparison: {
            percentile: calculateTeamPercentile(personalMetrics, teamWithSessions),
            ranking: calculateTeamRanking(user._id, teamWithSessions),
            contribution: calculateTeamContribution(personalMetrics, teamWithSessions)
          },
          dynamics: {
            synergy: teamInsights.teamDynamics.synergy,
            collaboration: teamInsights.collaborationScore,
            impact: calculateTeamImpact(personalMetrics, teamWithSessions)
          },
          challenges: {
            active: teamInsights.recommendations,
            completed: teamMetrics.completedChallenges,
            contribution: teamMetrics.challengeContribution
          }
        } : null
      }
    });
  } catch (error) {
    console.error("Analytics API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateProductivityScore(metrics: ProductivityMetrics): number {
  const focusWeight = 0.4;
  const completionWeight = 0.3;
  const streakWeight = 0.2;
  const distractionWeight = 0.1;

  const focusScore = metrics.focusScore;
  const completionScore = metrics.completionRate * 100;
  const streakScore = Math.min(metrics.longestStreak * 10, 100);
  const distractionScore = Math.max(0, 100 - (metrics.distractionRate * 100));

  return Math.round(
    focusScore * focusWeight +
    completionScore * completionWeight +
    streakScore * streakWeight +
    distractionScore * distractionWeight
  );
}

function getTimeRange(timeframe: string): TimeRange {
  const end = new Date();
  const start = new Date();

  switch (timeframe) {
    case 'day':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start.setMonth(start.getMonth() - 1);
      break;
    default:
      start.setDate(start.getDate() - 7);
  }

  return { start, end };
}

async function calculatePersonalMetrics(user: any, timeRange: TimeRange): Promise<ProductivityMetrics> {
  const sessions = (user.workSessions || []).filter((s: any) => 
    new Date(s.startTime) >= timeRange.start && new Date(s.startTime) <= timeRange.end
  );

  const totalTime = sessions.reduce((acc: number, s: any) => acc + (s.duration || 0), 0);
  const focusScores = sessions.map((s: any) => s.focusScore).filter(Boolean);
  const averageFocusScore = focusScores.length ? 
    focusScores.reduce((a: number, b: number) => a + b, 0) / focusScores.length : 0;

  return {
    focusScore: averageFocusScore,
    totalTime,
    sessionsCompleted: sessions.length,
    averageSessionLength: sessions.length ? totalTime / sessions.length : 0,
    longestStreak: calculateStreak(sessions),
    distractionRate: calculateDistractionRate(sessions),
    completionRate: calculateCompletionRate(sessions)
  };
}

function calculateStreak(sessions: any[]): number {
  if (!sessions.length) return 0;
  
  const dailySessions = sessions.reduce((acc: Set<string>, session: any) => {
    acc.add(new Date(session.startTime).toDateString());
    return acc;
  }, new Set<string>());

  const dates = Array.from(dailySessions).map(dateStr => new Date(dateStr))
    .sort((a, b) => a.getTime() - b.getTime());

  let currentStreak = 1;
  let maxStreak = 1;

  for (let i = 1; i < dates.length; i++) {
    const dayDiff = (dates[i].getTime() - dates[i-1].getTime()) / (1000 * 60 * 60 * 24);
    if (dayDiff === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

function calculateDistractionRate(sessions: any[]): number {
  if (!sessions.length) return 0;
  
  const totalDistractions = sessions.reduce((acc: number, session: any) => 
    acc + (session.distractions?.length || 0), 0
  );

  return totalDistractions / sessions.length;
}

function calculateCompletionRate(sessions: any[]): number {
  if (!sessions.length) return 0;
  
  const completedSessions = sessions.filter((s: any) => s.status === 'completed').length;
  return completedSessions / sessions.length;
}

function analyzeProductivityTrends(user: any, timeRange: TimeRange): TrendAnalysis {
  const sessions = (user.workSessions || []).filter((s: any) => 
    new Date(s.startTime) >= timeRange.start && new Date(s.startTime) <= timeRange.end
  );

  if (!sessions.length) {
    return {
      trend: 'stable',
      changePercentage: 0,
      insights: ['Not enough data to analyze trends']
    };
  }

  // Split the time range into two periods for comparison
  const midPoint = new Date((timeRange.start.getTime() + timeRange.end.getTime()) / 2);
  const firstHalf = sessions.filter((s: any) => new Date(s.startTime) < midPoint);
  const secondHalf = sessions.filter((s: any) => new Date(s.startTime) >= midPoint);

  const firstHalfScore = calculateAverageProductivity(firstHalf);
  const secondHalfScore = calculateAverageProductivity(secondHalf);
  
  const changePercentage = firstHalfScore === 0 ? 0 : 
    ((secondHalfScore - firstHalfScore) / firstHalfScore) * 100;

  let trend: 'improving' | 'stable' | 'declining';
  if (changePercentage > 5) trend = 'improving';
  else if (changePercentage < -5) trend = 'declining';
  else trend = 'stable';

  return {
    trend,
    changePercentage,
    insights: generateTrendInsights(sessions, trend, changePercentage)
  };
}

function calculateAverageProductivity(sessions: any[]): number {
  if (!sessions.length) return 0;
  return sessions.reduce((acc: number, s: any) => acc + (s.focusScore || 0), 0) / sessions.length;
}

function generateTrendInsights(sessions: any[], trend: string, change: number): string[] {
  const insights: string[] = [];
  
  if (trend === 'improving') {
    insights.push(`Your productivity has increased by ${Math.abs(change).toFixed(1)}%`);
    if (sessions.length > 5) {
      insights.push("You're maintaining consistent focus sessions");
    }
  } else if (trend === 'declining') {
    insights.push(`Your productivity has decreased by ${Math.abs(change).toFixed(1)}%`);
    insights.push("Consider adjusting your work patterns");
  } else {
    insights.push("Your productivity remains consistent");
  }

  return insights;
}

function calculatePeakPerformanceTimes(sessions: any[]) {
  const hourlyScores: { [hour: number]: { total: number; count: number } } = {};
  
  sessions.forEach((session: any) => {
    const hour = new Date(session.startTime).getHours();
    if (!hourlyScores[hour]) {
      hourlyScores[hour] = { total: 0, count: 0 };
    }
    hourlyScores[hour].total += session.focusScore || 0;
    hourlyScores[hour].count++;
  });

  const hours = Object.entries(hourlyScores)
    .map(([hour, data]) => ({
      time: `${hour}:00`,
      score: data.total / data.count
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return {
    hours,
    optimalDuration: calculateOptimalDuration(sessions)
  };
}

function calculateOptimalDuration(sessions: any[]): number {
  if (!sessions.length) return 25; // Default Pomodoro duration

  const durationScores = sessions.map(s => ({
    duration: s.duration,
    score: s.focusScore || 0
  }));

  const grouped = durationScores.reduce((acc: any, curr) => {
    const key = Math.floor(curr.duration / 15) * 15;
    if (!acc[key]) acc[key] = { total: 0, count: 0 };
    acc[key].total += curr.score;
    acc[key].count++;
    return acc;
  }, {});

  let bestDuration = 25;
  let bestScore = 0;

  Object.entries(grouped).forEach(([duration, data]: [string, any]) => {
    const avgScore = data.total / data.count;
    if (avgScore > bestScore) {
      bestScore = avgScore;
      bestDuration = parseInt(duration);
    }
  });

  return bestDuration;
}

function analyzeHabitPatterns(sessions: any[]) {
  const dayMap = new Array(7).fill(0);
  const timeMap = new Array(24).fill(0);
  
  sessions.forEach((session: any) => {
    const date = new Date(session.startTime);
    dayMap[date.getDay()]++;
    timeMap[date.getHours()]++;
  });

  const consistencyScore = calculateConsistencyScore(dayMap, timeMap);

  return {
    strength: determineHabitStrength(consistencyScore),
    consistencyScore,
    environment: determinePreferredEnvironment(sessions),
    breaks: analyzeBreakPatterns(sessions)
  };
}

function calculateConsistencyScore(dayMap: number[], timeMap: number[]): number {
  const dayVariance = calculateVariance(dayMap);
  const timeVariance = calculateVariance(timeMap);
  
  return Math.max(0, 100 - ((dayVariance + timeVariance) / 2));
}

function calculateVariance(numbers: number[]): number {
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  return Math.sqrt(
    numbers.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numbers.length
  );
}

function determineHabitStrength(consistencyScore: number): string {
  if (consistencyScore >= 80) return 'Strong';
  if (consistencyScore >= 60) return 'Building';
  if (consistencyScore >= 40) return 'Developing';
  return 'Forming';
}

function determinePreferredEnvironment(sessions: any[]): string[] {
  const environments = sessions.map((s: any) => s.environment).filter(Boolean);
  if (!environments.length) return ['No environment data available'];

  const noisePreference = environments.reduce((acc: any, env: any) => {
    acc[env.noiseLevel] = (acc[env.noiseLevel] || 0) + 1;
    return acc;
  }, {});

  const preferredNoise = Object.entries(noisePreference)
    .sort(([,a]: any, [,b]: any) => b - a)[0][0];

  return [
    `Preferred noise level: ${preferredNoise}`,
    'Most productive on desktop',
    'Regular workspace'
  ];
}

function analyzeBreakPatterns(sessions: any[]) {
  const sessionsWithBreaks = sessions.filter((s: any) => s.breaks?.length);
  if (!sessionsWithBreaks.length) {
    return {
      optimalDuration: 5,
      frequency: 0,
      effectiveness: 0
    };
  }

  const allBreaks = sessionsWithBreaks.flatMap((s: any) => s.breaks);
  const avgDuration = allBreaks.reduce((acc: number, b: any) => acc + b.duration, 0) / allBreaks.length;
  const avgEffectiveness = allBreaks.reduce((acc: number, b: any) => acc + (b.effectivenessScore || 0), 0) / allBreaks.length;

  return {
    optimalDuration: Math.round(avgDuration),
    frequency: sessionsWithBreaks.length / sessions.length,
    effectiveness: avgEffectiveness
  };
}

function analyzeFocusQuality(sessions: any[]) {
  if (!sessions.length) {
    return {
      deepFocusPercentage: 0,
      averageFlowState: 0,
      distractionPatterns: {
        commonTypes: [],
        peakTimes: [],
        recoveryTime: 0
      },
      recoveryRate: 0
    };
  }

  const deepFocusSessions = sessions.filter((s: any) => (s.focusScore || 0) >= 80);
  const deepFocusPercentage = (deepFocusSessions.length / sessions.length) * 100;

  const allDistractions = sessions.flatMap((s: any) => s.distractions || []);
  const distractionTypes = allDistractions.reduce((acc: any, d: any) => {
    acc[d.type] = (acc[d.type] || 0) + 1;
    return acc;
  }, {});

  const commonTypes = Object.entries(distractionTypes)
    .map(([type, count]) => ({ type, count }))
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 3);

  const avgRecoveryTime = allDistractions.reduce((acc: number, d: any) => 
    acc + (d.recoveryTime || 0), 0) / (allDistractions.length || 1);

  return {
    deepFocusPercentage,
    averageFlowState: calculateAverageFlowState(sessions),
    distractionPatterns: {
      commonTypes,
      peakTimes: calculateDistractionPeakTimes(allDistractions),
      recoveryTime: avgRecoveryTime
    },
    recoveryRate: calculateRecoveryRate(sessions)
  };
}

function calculateAverageFlowState(sessions: any[]): number {
  return sessions.reduce((acc: number, s: any) => 
    acc + ((s.metrics?.focusTimePercentage || 0) * (s.focusScore || 0)) / 100, 0
  ) / sessions.length;
}

function calculateDistractionPeakTimes(distractions: any[]): string[] {
  const hourCounts = new Array(24).fill(0);
  
  distractions.forEach((d: any) => {
    const hour = new Date(d.timestamp).getHours();
    hourCounts[hour]++;
  });

  return hourCounts
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(({ hour }) => `${hour}:00`);
}

function calculateRecoveryRate(sessions: any[]): number {
  const sessionsWithDistractions = sessions.filter((s: any) => 
    s.distractions?.length && s.focusScore
  );

  if (!sessionsWithDistractions.length) return 100;

  return sessionsWithDistractions.reduce((acc: number, session: any) => {
    const preDistractionScore = session.focusScore;
    const postDistractionScores = session.distractions.map((d: any) => d.postRecoveryScore || 0);
    const avgPostScore = postDistractionScores.reduce((a: number, b: number) => a + b, 0) / postDistractionScores.length;
    
    return acc + (avgPostScore / preDistractionScore);
  }, 0) / sessionsWithDistractions.length * 100;
}

function calculateAchievementProgress(user: any) {
  return {
    current: ['Focus Master', 'Early Bird', 'Team Player'],
    next: ['Productivity Guru', 'Flow State Master'],
    recent: ['Week Warrior', 'Perfect Week'],
    progressMap: {
      'Productivity Guru': 75,
      'Flow State Master': 60,
      'Team Synergy': 40
    }
  };
}

function generateImprovementSuggestions(metrics: ProductivityMetrics): string[] {
  const suggestions: string[] = [];

  if (metrics.focusScore < 70) {
    suggestions.push("Try shorter focus sessions with more frequent breaks");
  }
  if (metrics.distractionRate > 0.3) {
    suggestions.push("Consider using website blockers during focus sessions");
  }
  if (metrics.completionRate < 0.8) {
    suggestions.push("Set more achievable session durations");
  }

  return suggestions;
}

function calculateNextMilestones(metrics: ProductivityMetrics): any[] {
  return [
    {
      type: 'focus_time',
      target: Math.ceil(metrics.totalTime / 3600) * 3600 + 3600,
      current: metrics.totalTime,
      reward: 100
    },
    {
      type: 'streak',
      target: Math.ceil(metrics.longestStreak / 5) * 5 + 5,
      current: metrics.longestStreak,
      reward: 150
    },
    {
      type: 'sessions',
      target: Math.ceil(metrics.sessionsCompleted / 10) * 10 + 10,
      current: metrics.sessionsCompleted,
      reward: 200
    }
  ];
}

function generateProductivityPredictions(trends: TrendAnalysis): any {
  const baseIncrease = trends.trend === 'improving' ? Math.abs(trends.changePercentage) : 5;
  const confidence = trends.trend === 'stable' ? 80 : 70;

  return {
    nextWeek: {
      expectedGrowth: baseIncrease,
      confidence,
      factors: generateGrowthFactors(trends)
    },
    nextMonth: {
      expectedGrowth: baseIncrease * 3,
      confidence: Math.max(50, confidence - 10),
      factors: generateGrowthFactors(trends)
    },
    potentialGains: {
      productivity: Math.round(baseIncrease * 1.2),
      focusTime: Math.round(baseIncrease * 1.5),
      efficiency: Math.round(baseIncrease * 1.1)
    }
  };
}

function generateGrowthFactors(trends: TrendAnalysis): string[] {
  const factors: string[] = [];
  
  if (trends.trend === 'improving') {
    factors.push("Consistent session completion");
    factors.push("Improving focus scores");
  } else if (trends.trend === 'stable') {
    factors.push("Established work routine");
    factors.push("Consistent performance");
  } else {
    factors.push("Variable session completion");
    factors.push("Fluctuating focus scores");
  }

  return factors;
}

async function calculateTeamMetrics(team: any, timeRange: TimeRange) {
  const teamSessions = team.members.flatMap((m: any) => 
    m.userId.workSessions?.filter((s: any) => 
      new Date(s.startTime) >= timeRange.start && 
      new Date(s.startTime) <= timeRange.end
    ) || []
  );

  return {
    totalSessions: teamSessions.length,
    averageProductivity: calculateTeamProductivity(teamSessions),
    totalFocusTime: calculateTeamFocusTime(teamSessions),
    completedChallenges: team.challenges?.filter((c: any) => c.status === 'completed')?.length || 0,
    challengeContribution: calculateChallengeContribution(team.challenges || [])
  };
}

function calculateTeamProductivity(sessions: any[]): number {
  if (!sessions.length) return 0;
  return sessions.reduce((acc: number, s: any) => acc + (s.focusScore || 0), 0) / sessions.length;
}

function calculateTeamFocusTime(sessions: any[]): number {
  return sessions.reduce((acc: number, s: any) => acc + (s.duration || 0), 0);
}

function calculateChallengeContribution(challenges: any[]): number {
  if (!challenges.length) return 0;
  const completedChallenges = challenges.filter(c => c.status === 'completed');
  return (completedChallenges.length / challenges.length) * 100;
}

function calculateTeamPercentile(personal: ProductivityMetrics, team: TeamDocument): number {
  const personalScore = personal.focusScore;
  const teamScores = team.members.map(m => 
    calculateAverageProductivity(m.userId.workSessions || [])
  );
  
  const belowCount = teamScores.filter(score => score < personalScore).length;
  return (belowCount / teamScores.length) * 100;
}

function calculateTeamRanking(userId: string, team: TeamDocument): number {
  const memberScores = team.members.map(m => ({
    id: m.userId._id.toString(),
    score: calculateAverageProductivity(m.userId.workSessions || [])
  }));

  memberScores.sort((a, b) => b.score - a.score);
  return memberScores.findIndex(m => m.id === userId) + 1;
}

function calculateTeamContribution(personal: ProductivityMetrics, team: TeamDocument): number {
  const totalTeamTime = calculateTeamFocusTime(team.members.flatMap(m => m.userId.workSessions || []));
  return (personal.totalTime / totalTeamTime) * 100;
}

function calculateTeamImpact(personal: ProductivityMetrics, team: TeamDocument): number {
  const teamAverage = team.averageProductivity;
  const personalScore = personal.focusScore;
  return ((personalScore - teamAverage) / teamAverage) * 100;
} 
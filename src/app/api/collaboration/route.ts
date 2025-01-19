import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Team, { ITeam, ITeamMember, ITeamChallenge, ITeamStats, ITeamAchievement } from "@/models/Team";
import User from "@/models/User";
import mongoose, { Document } from "mongoose";
import { getTeamSyncSuggestions, generateTeamInsights } from "@/lib/aiService";

interface WorkSession {
  startTime: Date;
  endTime?: Date;
  duration: number;
  focusScore: number;
}

interface CollaborationSession {
  teamCode: string;
  startTime: Date;
  duration: number;
  type: 'focus' | 'break' | 'collaboration';
  participants?: string[];
  notes?: string;
}

interface TeamMemberUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  profile?: {
    avatar?: string;
  };
  workSessions?: WorkSession[];
}

interface TeamMemberWithSession {
  userId: TeamMemberUser;
  role: 'leader' | 'member';
  joinedAt: Date;
}

interface TeamWithMembers extends Document {
  name: string;
  code: string;
  description: string;
  avatar: string;
  members: TeamMemberWithSession[];
  stats: ITeamStats;
  challenges: ITeamChallenge[];
  achievements: ITeamAchievement[];
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

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const team = await Team.findOne({ code: user.teamCode })
      .populate<{ members: TeamMemberWithSession[] }>('members.userId', 'name email profile.avatar workSessions')
      .lean<TeamWithMembers>();

    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found" },
        { status: 404 }
      );
    }

    // Calculate team metrics
    const teamMetrics = {
      totalFocusHours: team.stats.totalFocusTime / 60,
      averageProductivity: team.stats.averageProductivity,
      activeMembers: team.members.filter(m => m.userId.workSessions?.some(s => 
        s.endTime && new Date(s.endTime).toDateString() === new Date().toDateString()
      )).length,
      totalSessions: team.members.reduce((acc, m) => 
        acc + (m.userId.workSessions?.length || 0), 0),
      weeklyParticipation: team.members.filter(m => m.userId.workSessions?.some(s => {
        if (!s.endTime) return false;
        const sessionDate = new Date(s.endTime);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return sessionDate >= weekAgo;
      })).length / team.members.length * 100
    };

    // Get team insights and sync suggestions
    const [insights, syncSuggestions] = await Promise.all([
      generateTeamInsights(team),
      getTeamSyncSuggestions({
        members: team.members,
        metrics: {
          totalFocusHours: teamMetrics.totalFocusHours,
          averageProductivity: teamMetrics.averageProductivity,
          activeMembers: teamMetrics.activeMembers,
          totalSessions: teamMetrics.totalSessions,
          weeklyParticipation: teamMetrics.weeklyParticipation
        },
        sessions: team.members.flatMap(m => 
          m.userId.workSessions?.map(s => ({
            userId: m.userId._id,
            startTime: s.startTime,
            duration: s.duration,
            focusScore: s.focusScore
          })) || []
        ).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        teamStats: {
          totalMembers: team.members.length,
          averageProductivity: teamMetrics.averageProductivity,
          totalFocusTime: teamMetrics.totalFocusHours * 60,
          teamSynergy: insights.teamDynamics.synergy,
          activeMembers: teamMetrics.activeMembers,
          recentCollaborations: teamMetrics.weeklyParticipation
        },
        memberStats: team.members.map(member => ({
          userId: member.userId._id.toString(),
          name: member.userId.name,
          email: member.userId.email,
          image: member.userId.profile?.avatar,
          productivityScore: member.userId.workSessions?.reduce((acc, s) => 
            acc + (s?.focusScore || 0), 0) ?? 0 / (member.userId.workSessions?.length || 1),
          focusTime: member.userId.workSessions?.reduce((acc, s) => 
            acc + (s?.duration || 0), 0) ?? 0,
          lastActive: member.userId.workSessions?.length ? 
            Math.max(...(member.userId.workSessions
              .filter(s => s?.endTime)
              .map(s => new Date(s.endTime!).getTime()) || [Date.now()])) :
            member.joinedAt.getTime(),
          status: member.userId.workSessions?.some(s => 
            !s.endTime && new Date(s.startTime).toDateString() === new Date().toDateString()
          ) ? "focusing" : "online",
          strengths: insights.strengths.slice(0, 2),
          recentAchievements: team.achievements
            .filter(a => a.id && member.userId._id)
            .slice(0, 3)
            .map(a => a.name)
        })),
        aiInsights: {
          teamDynamics: {
            strengths: insights.strengths,
            improvements: insights.improvements,
            collaborationScore: insights.collaborationScore,
            performanceTrend: insights.performanceTrend
          },
          recommendations: insights.recommendations,
          focusPatterns: insights.focusPatterns,
          synergy: {
            score: insights.teamDynamics.synergy,
            factors: insights.teamDynamics.communicationEffectiveness > 75 ? 
              ["Strong communication", "Regular collaboration"] : 
              ["Building communication", "Growing collaboration"],
            opportunities: syncSuggestions.collaboration
          }
        },
        recentActivity: team.members.flatMap(m => 
          m.userId.workSessions?.filter(s => s.endTime).slice(0, 5).map(s => ({
            type: "focus",
            user: m.userId.name,
            action: `Completed a ${Math.round(s.duration / 60)} minute focus session`,
            timestamp: s.endTime!,
            impact: s.focusScore
          })) || []
        ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10),
        challenges: team.challenges.map(c => ({
          id: c.id,
          title: c.name,
          description: c.description,
          participants: c.participants,
          progress: (c.progress / c.target) * 100,
          deadline: c.endDate,
          rewards: {
            xp: c.rewards.points,
            coins: Math.round(c.rewards.points * 0.1),
            achievement: c.rewards.badges[0]
          }
        }))
      }
    });
  } catch (error) {
    console.error("Collaboration API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const sessionData: CollaborationSession = await request.json();
    const team = await Team.findOne({ code: sessionData.teamCode });

    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found" },
        { status: 404 }
      );
    }

    if (!team.sessions) team.sessions = [];
    team.sessions.push({
      ...sessionData,
      userId: user._id
    });

    await team.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Collaboration API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateTeamProductivity(members: any[]): number {
  const scores = members.map(m => calculateProductivityScore(m));
  return scores.reduce((acc, score) => acc + score, 0) / scores.length;
}

function calculateTeamFocusTime(members: any[]): number {
  return members.reduce((total, member) => 
    total + member.workSessions.reduce((acc: number, session: any) => 
      acc + session.duration, 0
    ), 0
  );
}

function calculateTeamSynergy(members: any[]): number {
  const factors = [
    calculateSessionOverlap(members),
    calculateBreakAlignment(members),
    calculateChallengeParticipation(members)
  ];
  return factors.reduce((acc, factor) => acc + factor, 0) / factors.length;
}

function countActiveMembers(members: any[]): number {
  const now = new Date();
  const activeThreshold = new Date(now.getTime() - 30 * 60000); // 30 minutes
  return members.filter(member => 
    member.workSessions.some((session: any) => 
      new Date(session.startTime) > activeThreshold
    )
  ).length;
}

function countRecentCollaborations(members: any[]): number {
  // Count shared focus sessions or team challenges
  return members.reduce((total, member) => 
    total + (member.workSessions.filter((session: any) => 
      session.type === 'collaboration'
    ).length), 0
  );
}

function calculateProductivityScore(member: any): number {
  if (!member.workSessions?.length) return 0;
  
  const recentSessions = member.workSessions.slice(-10);
  const averageScore = recentSessions.reduce((acc: number, session: any) => 
    acc + (session.focusScore || 0), 0
  ) / recentSessions.length;
  
  return Math.round(averageScore);
}

function calculateTotalFocusTime(member: any): number {
  return member.workSessions.reduce((total: number, session: any) => 
    total + session.duration, 0
  );
}

function getLastActiveTime(member: any): Date {
  if (!member.workSessions?.length) return new Date(0);
  const sessions = [...member.workSessions].sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
  return new Date(sessions[0].startTime);
}

function determineUserStatus(member: any): 'online' | 'focusing' | 'break' | 'offline' {
  const now = new Date();
  const lastActive = getLastActiveTime(member);
  const timeDiff = now.getTime() - lastActive.getTime();

  if (timeDiff > 30 * 60000) return 'offline';
  
  const currentSession = member.workSessions.find((session: any) => 
    new Date(session.startTime).getTime() + session.duration * 60000 > now.getTime()
  );

  if (currentSession) {
    return currentSession.type === 'break' ? 'break' : 'focusing';
  }

  return 'online';
}

function analyzeTeamFocusPatterns(members: any[]) {
  const sessions = members.flatMap(m => m.workSessions);
  
  return {
    peakHours: calculatePeakHours(sessions),
    commonBreakTimes: findCommonBreakTimes(sessions),
    productiveWeekdays: findProductiveWeekdays(sessions)
  };
}

function generateSynergyFactors(members: any[]): string[] {
  const synergy = calculateTeamSynergy(members);
  const factors = [];

  if (synergy > 80) {
    factors.push("High session synchronization");
    factors.push("Effective break coordination");
    factors.push("Strong challenge participation");
  } else if (synergy > 60) {
    factors.push("Good work rhythm alignment");
    factors.push("Regular collaborative sessions");
  } else {
    factors.push("Individual productivity focus");
    factors.push("Potential for more synchronization");
  }

  return factors;
}

function generateTeamChallenges(members: any[]): any[] {
  const teamSize = members.length;
  const averageProductivity = calculateTeamProductivity(members);

  return [
    {
      id: new mongoose.Types.ObjectId().toString(),
      title: "Synchronized Focus Sprint",
      description: "Complete 4 team focus sessions with at least 3 members participating simultaneously",
      participants: members.map(m => m._id.toString()),
      progress: 0,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      rewards: {
        xp: 200,
        coins: 100,
        achievement: "Team Sync Master"
      }
    },
    {
      id: new mongoose.Types.ObjectId().toString(),
      title: "Productivity Chain Reaction",
      description: "Achieve a team average focus score of 85% or higher for 3 consecutive days",
      participants: members.map(m => m._id.toString()),
      progress: Math.min((averageProductivity / 85) * 100, 100),
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      rewards: {
        xp: 150,
        coins: 75
      }
    }
  ];
}

function formatTeamActivity(activities: any[]): any[] {
  return activities.map(activity => ({
    type: activity.type,
    user: activity.userName,
    action: activity.description,
    timestamp: activity.timestamp,
    impact: calculateActivityImpact(activity)
  }));
}

function calculateActivityImpact(activity: any): number {
  const impactScores: { [key: string]: number } = {
    'focus_session': 10,
    'challenge_complete': 20,
    'achievement_unlock': 15,
    'collaboration': 25
  };

  return impactScores[activity.type] || 5;
}

function calculateSessionOverlap(members: any[]): number {
  // Implementation for calculating session overlap percentage
  return 75; // Placeholder
}

function calculateBreakAlignment(members: any[]): number {
  // Implementation for calculating break time alignment
  return 80; // Placeholder
}

function calculateChallengeParticipation(members: any[]): number {
  // Implementation for calculating team challenge participation rate
  return 85; // Placeholder
}

function getRecentTeamActivity(members: any[]): any[] {
  const activities: any[] = [];
  members.forEach(member => {
    member.workSessions.slice(-5).forEach((session: any) => {
      activities.push({
        type: 'focus_session',
        userName: member.name,
        description: `Completed a ${session.duration} minute focus session`,
        timestamp: session.startTime,
        focusScore: session.focusScore
      });
    });
  });
  return activities.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ).slice(0, 10);
}

function calculatePeakHours(sessions: any[]): string[] {
  // Implementation for finding peak productivity hours
  return ['9:00 AM', '2:00 PM', '4:00 PM'];
}

function findCommonBreakTimes(sessions: any[]): string[] {
  // Implementation for finding common break times
  return ['10:30 AM', '1:00 PM', '3:30 PM'];
}

function findProductiveWeekdays(sessions: any[]): string[] {
  // Implementation for finding most productive weekdays
  return ['Tuesday', 'Wednesday', 'Thursday'];
}

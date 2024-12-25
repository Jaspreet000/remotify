import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import User from '@/models/User';
import Team from '@/models/Team';
import { verifyToken } from '@/lib/auth';
import { analyzeTeamProductivity } from '@/lib/aiService';

export async function GET(request: Request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded: any = verifyToken(token);

    // Get user's team
    const user = await User.findById(decoded.id).populate('teams');
    if (!user?.teams?.length) {
      return NextResponse.json(
        { success: false, message: 'No team found' },
        { status: 404 }
      );
    }

    const teamId = user.teams[0]._id; // Using first team for simplicity
    const team = await Team.findById(teamId)
      .populate('members')
      .populate({
        path: 'sessions',
        populate: {
          path: 'user',
          select: 'name avatar'
        }
      });

    // Calculate team metrics
    const teamMetrics = calculateTeamMetrics(team);
    
    // Get AI analysis
    const aiAnalysis = await analyzeTeamProductivity({
      metrics: teamMetrics,
      sessions: team.sessions,
      members: team.members
    });

    // Format response
    const response = {
      teamMetrics,
      memberStats: formatMemberStats(team.members),
      collaborationScore: calculateCollaborationScore(team),
      aiInsights: parseAIAnalysis(aiAnalysis),
      recentActivity: formatRecentActivity(team.sessions),
      peakHours: calculatePeakHours(team.sessions)
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Team Analytics Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateTeamMetrics(team: any) {
  const now = new Date();
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recentSessions = team.sessions.filter(
    (s: any) => new Date(s.startTime) >= lastWeek
  );

  return {
    totalFocusHours: recentSessions.reduce(
      (acc: number, s: any) => acc + s.duration / 60,
      0
    ),
    averageProductivity: recentSessions.reduce(
      (acc: number, s: any) => acc + s.focusScore,
      0
    ) / recentSessions.length || 0,
    activeMembers: team.members.filter((m: any) => 
      recentSessions.some((s: any) => s.user._id.toString() === m._id.toString())
    ).length,
    totalSessions: recentSessions.length,
    weeklyParticipation: (team.members.filter((m: any) => 
      recentSessions.some((s: any) => s.user._id.toString() === m._id.toString())
    ).length / team.members.length) * 100
  };
}

function formatMemberStats(members: any[]) {
  return members.map(member => ({
    id: member._id,
    name: member.name,
    avatar: member.avatar,
    stats: {
      focusHours: calculateMemberFocusHours(member),
      productivity: calculateMemberProductivity(member),
      contribution: calculateMemberContribution(member),
      streak: member.currentStreak || 0
    },
    availability: member.availability || 'offline'
  }));
}

function calculateCollaborationScore(team: any) {
  const factors = {
    sessionOverlap: calculateSessionOverlap(team.sessions),
    memberParticipation: team.members.length > 0 ? 
      team.sessions.length / team.members.length : 0,
    productivityAlignment: calculateProductivityAlignment(team.sessions)
  };

  return Math.round(
    (factors.sessionOverlap * 0.4 + 
     factors.memberParticipation * 0.3 + 
     factors.productivityAlignment * 0.3) * 100
  );
}

function calculatePeakHours(sessions: any[]) {
  const hourCounts = new Array(24).fill(0);
  const hourScores = new Array(24).fill(0);

  sessions.forEach(session => {
    const hour = new Date(session.startTime).getHours();
    hourCounts[hour]++;
    hourScores[hour] += session.focusScore || 0;
  });

  return hourCounts.map((count, hour) => ({
    hour,
    sessions: count,
    averageScore: count > 0 ? hourScores[hour] / count : 0
  })).sort((a, b) => b.averageScore - a.averageScore);
}

function formatRecentActivity(sessions: any[]) {
  return sessions
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 10)
    .map(session => ({
      type: 'focus_session',
      user: {
        name: session.user.name,
        avatar: session.user.avatar
      },
      duration: session.duration,
      score: session.focusScore,
      timestamp: session.startTime
    }));
}

// Helper functions
function calculateMemberFocusHours(member: any) {
  return member.workSessions?.reduce(
    (acc: number, session: any) => acc + session.duration / 60,
    0
  ) || 0;
}

function calculateMemberProductivity(member: any) {
  const sessions = member.workSessions || [];
  return sessions.length > 0
    ? sessions.reduce((acc: number, s: any) => acc + (s.focusScore || 0), 0) / sessions.length
    : 0;
}

function calculateMemberContribution(member: any) {
  // Implement contribution calculation logic
  return 0;
}

function calculateSessionOverlap(sessions: any[]) {
  // Implement session overlap calculation logic
  return 0;
}

function calculateProductivityAlignment(sessions: any[]) {
  // Implement productivity alignment calculation logic
  return 0;
}

function parseAIAnalysis(analysis: string) {
  // Parse AI analysis into structured format
  return {
    summary: 'Team is showing strong collaboration patterns',
    insights: [
      {
        type: 'strength',
        message: 'High focus session overlap between team members'
      },
      {
        type: 'improvement',
        message: 'Consider scheduling more joint focus sessions'
      }
    ],
    recommendations: [
      'Schedule team focus sessions during peak productivity hours',
      'Implement paired productivity sessions for knowledge sharing'
    ]
  };
} 
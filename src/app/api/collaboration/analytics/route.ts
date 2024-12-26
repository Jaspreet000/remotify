import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import User from '@/models/User';
import Team from '@/models/Team';
import { verifyToken } from '@/lib/auth';
import { analyzeTeamProductivity } from '@/lib/aiService';

interface DecodedToken {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

interface TeamMember {
  _id: string;
  name: string;
  avatar?: string;
  workSessions: FocusSession[];
  availability: 'online' | 'offline' | 'busy';
  currentStreak: number;
}

interface FocusSession {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  startTime: Date;
  duration: number;
  focusScore: number;
}

interface TeamMetrics {
  totalFocusHours: number;
  averageProductivity: number;
  activeMembers: number;
  totalSessions: number;
  weeklyParticipation: number;
}

interface TeamAnalytics {
  teamMetrics: TeamMetrics;
  memberStats: Array<{
    id: string;
    name: string;
    avatar?: string;
    stats: {
      focusHours: number;
      productivity: number;
      contribution: number;
      streak: number;
    };
    availability: string;
  }>;
  peakHours: Array<{
    hour: number;
    sessions: number;
    averageScore: number;
  }>;
}

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
    const decoded = verifyToken(token) as DecodedToken;

    const user = await User.findById(decoded.id).populate('teams');
    if (!user?.teams?.length) {
      return NextResponse.json(
        { success: false, message: 'No team found' },
        { status: 404 }
      );
    }

    const teamId = user.teams[0]._id;
    const team = await Team.findById(teamId)
      .populate<{ members: TeamMember[] }>('members')
      .populate<{ sessions: FocusSession[] }>({
        path: 'sessions',
        populate: {
          path: 'user',
          select: 'name avatar'
        }
      });

    if (!team) {
      return NextResponse.json(
        { success: false, message: 'Team not found' },
        { status: 404 }
      );
    }

    const teamMetrics = calculateTeamMetrics(team.sessions);
    const insights = await analyzeTeamProductivity({
      metrics: teamMetrics,
      sessions: team.sessions,
      members: team.members
    });

    const response: TeamAnalytics = {
      teamMetrics,
      memberStats: formatMemberStats(team.members),
      peakHours: calculatePeakHours(team.sessions)
    };

    return NextResponse.json({ 
      success: true, 
      data: {
        ...response,
        aiInsights: insights
      }
    });
  } catch (error) {
    console.error('Team Analytics Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateTeamMetrics(sessions: FocusSession[]): TeamMetrics {
  const now = new Date();
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentSessions = sessions.filter(s => new Date(s.startTime) >= lastWeek);

  return {
    totalFocusHours: recentSessions.reduce((acc, s) => acc + s.duration / 60, 0),
    averageProductivity: recentSessions.reduce((acc, s) => acc + s.focusScore, 0) / recentSessions.length || 0,
    activeMembers: new Set(recentSessions.map(s => s.user._id)).size,
    totalSessions: recentSessions.length,
    weeklyParticipation: 0 // Calculate based on team size
  };
}

function formatMemberStats(members: TeamMember[]) {
  return members.map(member => ({
    id: member._id,
    name: member.name,
    avatar: member.avatar,
    stats: {
      focusHours: calculateMemberFocusHours(member.workSessions),
      productivity: calculateMemberProductivity(member.workSessions),
      contribution: 0,
      streak: member.currentStreak
    },
    availability: member.availability
  }));
}

function calculatePeakHours(sessions: FocusSession[]) {
  const hourCounts = new Array(24).fill(0);
  const hourScores = new Array(24).fill(0);

  sessions.forEach(session => {
    const hour = new Date(session.startTime).getHours();
    hourCounts[hour]++;
    hourScores[hour] += session.focusScore;
  });

  return hourCounts.map((count, hour) => ({
    hour,
    sessions: count,
    averageScore: count > 0 ? hourScores[hour] / count : 0
  }));
}

function calculateMemberFocusHours(sessions: FocusSession[]): number {
  return sessions.reduce((acc, session) => acc + session.duration / 60, 0);
}

function calculateMemberProductivity(sessions: FocusSession[]): number {
  return sessions.length > 0
    ? sessions.reduce((acc, s) => acc + s.focusScore, 0) / sessions.length
    : 0;
} 
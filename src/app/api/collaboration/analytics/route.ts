import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import User from '@/models/User';
import Team from '@/models/Team';
import { verifyToken } from '@/lib/auth';
import { analyzeTeamDynamics } from '@/lib/aiService';

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
    const analysis = await analyzeTeamDynamics({
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
        aiInsights: analysis
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

function calculateTeamMetrics(sessions: any[]): {
  averageProductivity: number;
  collaborationScore: number;
  participationRate: number;
} {
  if (!sessions.length) {
    return {
      averageProductivity: 0,
      collaborationScore: 0,
      participationRate: 0
    };
  }

  const avgProductivity = sessions.reduce((acc, s) => acc + s.productivity, 0) / sessions.length;
  const collaborationScore = sessions.reduce((acc, s) => acc + (s.participants.length > 1 ? 1 : 0), 0) / sessions.length * 100;
  const participationRate = sessions.reduce((acc, s) => acc + s.participants.length, 0) / (sessions.length * team.members.length) * 100;

  return {
    averageProductivity: Math.round(avgProductivity),
    collaborationScore: Math.round(collaborationScore),
    participationRate: Math.round(participationRate)
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
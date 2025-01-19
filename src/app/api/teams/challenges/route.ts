import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Team from '@/models/Team';
import User from '@/models/User';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { nanoid } from 'nanoid';

// GET /api/teams/challenges - Get team challenges
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
    if (!user.teamCode) {
      return NextResponse.json(
        { success: false, message: "User does not belong to a team" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const team = await Team.findOne({ code: user.teamCode })
      .populate('challenges.participants', 'name email profile.avatar')
      .lean();

    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found" },
        { status: 404 }
      );
    }

    const teamDoc = team as { challenges?: any[] };
    let challenges = teamDoc.challenges || [];
    if (status) {
      challenges = challenges.filter(c => c.status === status);
    }

    // Calculate progress for each challenge
    const challengesWithProgress = challenges.map(challenge => ({
      ...challenge,
      participants: challenge.participants.map((participant: { name: string; email: string; profile: { avatar: string } }) => ({
        ...participant,
        progress: calculateParticipantProgress(participant, challenge)
      }))
    }));

    return NextResponse.json({
      success: true,
      data: challengesWithProgress
    });
  } catch (error) {
    console.error('Team Challenges API Error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/teams/challenges - Create a new challenge
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
    if (!user.teamCode) {
      return NextResponse.json(
        { success: false, message: "User does not belong to a team" },
        { status: 400 }
      );
    }

    const team = await Team.findOne({ code: user.teamCode });
    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found" },
        { status: 404 }
      );
    }

    // Check if user is team leader
    const member = team.members.find((m: { userId: { equals: (id: any) => boolean }; role: string }) => m.userId.equals(user._id));
    if (!member || member.role !== 'leader') {
      return NextResponse.json(
        { success: false, message: "Only team leaders can create challenges" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, type, target, startDate, endDate, rewards } = body;

    // Validate required fields
    if (!name || !description || !type || !target || !startDate || !endDate || !rewards) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create challenge
    const challenge = {
      id: nanoid(),
      name,
      description,
      type,
      target,
      progress: 0,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'active',
      participants: [user._id], // Creator is first participant
      rewards
    };

    await team.startChallenge(challenge);

    const updatedTeam = await Team.findOne({ code: user.teamCode })
      .populate('challenges.participants', 'name email profile.avatar')
      .lean();

    if (!updatedTeam) {
      return NextResponse.json(
        { success: false, message: "Team not found after update" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: (updatedTeam as unknown as { challenges: any[] }).challenges.find(c => c.id === challenge.id)
    });
  } catch (error) {
    console.error('Team Challenges API Error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/teams/challenges - Update challenge progress or join/leave challenge
export async function PATCH(request: Request) {
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
    if (!user.teamCode) {
      return NextResponse.json(
        { success: false, message: "User does not belong to a team" },
        { status: 400 }
      );
    }

    const team = await Team.findOne({ code: user.teamCode });
    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { challengeId, action, progress } = body;

    const challenge = team.challenges.find((c: { id: string }) => c.id === challengeId);
    if (!challenge) {
      return NextResponse.json(
        { success: false, message: "Challenge not found" },
        { status: 404 }
      );
    }

    if (challenge.status !== 'active') {
      return NextResponse.json(
        { success: false, message: "Challenge is not active" },
        { status: 400 }
      );
    }

    switch (action) {
      case 'join':
        if (!challenge.participants.includes(user._id)) {
          challenge.participants.push(user._id);
        }
        break;

      case 'leave':
        challenge.participants = challenge.participants.filter(
          (p: { equals: (id: any) => boolean }) => !p.equals(user._id)
        );
        break;

      case 'update':
        if (!challenge.participants.some((p: { equals: (id: any) => boolean }) => p.equals(user._id))) {
          return NextResponse.json(
            { success: false, message: "User is not a participant" },
            { status: 400 }
          );
        }
        await team.updateChallengeProgress(challengeId, progress);
        break;

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }

    await team.save();

    const updatedTeam = await Team.findOne({ code: user.teamCode })
      .populate('challenges.participants', 'name email profile.avatar')
      .lean();

    if (!updatedTeam) {
      return NextResponse.json(
        { success: false, message: "Team not found after update" },
        { status: 404 }
      );
    }

    const updatedChallenge = (updatedTeam as unknown as { challenges: any[] }).challenges.find(c => c.id === challengeId);
    
    return NextResponse.json({
      success: true,
      data: {
        ...updatedChallenge,
        participants: updatedChallenge.participants.map((participant: { name: string; email: string; profile: { avatar: string } }) => ({
          ...participant,
          progress: calculateParticipantProgress(participant, updatedChallenge)
        }))
      }
    });
  } catch (error) {
    console.error('Team Challenges API Error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to calculate participant's progress in a challenge
function calculateParticipantProgress(participant: any, challenge: any) {
  switch (challenge.type) {
    case 'focus':
      // Calculate total focus time in the challenge period
      const focusTime = participant.workSessions?.reduce((total: number, session: any) => {
        const sessionDate = new Date(session.startTime);
        if (sessionDate >= challenge.startDate && sessionDate <= challenge.endDate) {
          return total + session.duration;
        }
        return total;
      }, 0) || 0;
      return Math.min((focusTime / challenge.target) * 100, 100);

    case 'collaboration':
      // Calculate collaboration score based on team interactions
      const collaborationScore = participant.stats?.collaborationScore || 0;
      return Math.min((collaborationScore / challenge.target) * 100, 100);

    case 'streak':
      // Calculate current streak
      const streak = participant.stats?.weeklyStreak || 0;
      return Math.min((streak / challenge.target) * 100, 100);

    case 'custom':
      // For custom challenges, use the overall progress
      return Math.min((challenge.progress / challenge.target) * 100, 100);

    default:
      return 0;
  }
} 
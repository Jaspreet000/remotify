import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Team from '@/models/Team';
import User from '@/models/User';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/teams/members - Join a team
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
    if (user.teamCode) {
      return NextResponse.json(
        { success: false, message: "User already belongs to a team" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { teamCode } = body;

    if (!teamCode) {
      return NextResponse.json(
        { success: false, message: "Team code is required" },
        { status: 400 }
      );
    }

    const team = await Team.findOne({ code: teamCode });
    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found" },
        { status: 404 }
      );
    }

    // Add user to team
    await team.addMember(user._id);

    // Update user's team code
    await User.findByIdAndUpdate(user._id, { teamCode });

    const updatedTeam = await Team.findOne({ code: teamCode })
      .populate('members.userId', 'name email profile.avatar')
      .lean();

    return NextResponse.json({
      success: true,
      data: updatedTeam
    });
  } catch (error) {
    console.error('Team Members API Error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/members - Leave team
export async function DELETE(request: Request) {
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

    // Check if user is the team leader
    const member = team.members.find(m => m.userId.equals(user._id));
    if (member?.role === 'leader') {
      return NextResponse.json(
        { success: false, message: "Team leader cannot leave. Delete the team instead." },
        { status: 400 }
      );
    }

    // Remove user from team
    await team.removeMember(user._id);

    // Remove team code from user
    await User.findByIdAndUpdate(user._id, { $unset: { teamCode: 1 } });

    return NextResponse.json({
      success: true,
      message: "Successfully left the team"
    });
  } catch (error) {
    console.error('Team Members API Error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/teams/members - Update member role
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

    // Check if user is team leader
    const currentMember = team.members.find(m => m.userId.equals(user._id));
    if (!currentMember || currentMember.role !== 'leader') {
      return NextResponse.json(
        { success: false, message: "Only team leaders can update member roles" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { memberId, role } = body;

    if (!memberId || !role || !['leader', 'member'].includes(role)) {
      return NextResponse.json(
        { success: false, message: "Invalid member ID or role" },
        { status: 400 }
      );
    }

    // Find the target member
    const targetMember = team.members.find(m => m.userId.toString() === memberId);
    if (!targetMember) {
      return NextResponse.json(
        { success: false, message: "Member not found in team" },
        { status: 404 }
      );
    }

    // Update member role
    targetMember.role = role;
    await team.save();

    // If making someone else leader, demote current leader to member
    if (role === 'leader') {
      currentMember.role = 'member';
      await team.save();
    }

    const updatedTeam = await Team.findOne({ code: user.teamCode })
      .populate('members.userId', 'name email profile.avatar')
      .lean();

    return NextResponse.json({
      success: true,
      data: updatedTeam
    });
  } catch (error) {
    console.error('Team Members API Error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Team from '@/models/Team';
import User from '@/models/User';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateTeamInsights } from '@/lib/aiService';
import { nanoid } from 'nanoid';

// GET /api/teams - List teams or get user's team
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

    const { searchParams } = new URL(request.url);
    const teamCode = searchParams.get('code');

    const user = await User.findOne({ email: session.user.email });
    
    if (teamCode) {
      // Get specific team
      const team = await Team.findOne({ code: teamCode })
        .populate('members.userId', 'name email profile.avatar')
        .lean();

      if (!team) {
        return NextResponse.json(
          { success: false, message: "Team not found" },
          { status: 404 }
        );
      }

      // Generate team insights using AI
      const insights = await generateTeamInsights(team);

      return NextResponse.json({
        success: true,
        data: { ...team, insights }
      });
    } else if (user.teamCode) {
      // Get user's team
      const userTeam = await Team.findOne({ code: user.teamCode })
        .populate('members.userId', 'name email profile.avatar')
        .lean();

      if (!userTeam) {
        return NextResponse.json(
          { success: false, message: "Team not found" },
          { status: 404 }
        );
      }

      // Generate team insights using AI
      const insights = await generateTeamInsights(userTeam);

      return NextResponse.json({
        success: true,
        data: { ...userTeam, insights }
      });
    } else {
      // List all teams (paginated)
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const search = searchParams.get('search') || '';

      const query = search
        ? { name: { $regex: search, $options: 'i' } }
        : {};

      const teams = await Team.find(query)
        .select('name code description avatar stats leaderboard')
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      const total = await Team.countDocuments(query);

      return NextResponse.json({
        success: true,
        data: {
          teams,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    }
  } catch (error) {
    console.error('Teams API Error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/teams - Create a new team
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
    const { name, description, avatar } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Team name is required" },
        { status: 400 }
      );
    }

    // Generate a unique team code
    const code = nanoid(8);

    // Create the team
    const team = await Team.create({
      name,
      code,
      description: description || '',
      avatar: avatar || '',
      members: [{
        userId: user._id,
        role: 'leader',
        joinedAt: new Date()
      }],
      stats: {
        totalFocusTime: 0,
        averageProductivity: 0,
        weeklyStreak: 0,
        collaborationScore: 0,
        lastUpdated: new Date()
      },
      leaderboard: {
        weeklyScore: 0,
        weeklyRank: 0,
        monthlyScore: 0,
        monthlyRank: 0,
        allTimeScore: 0,
        allTimeRank: 0,
        lastUpdated: new Date()
      }
    });

    // Update user's team code
    await User.findByIdAndUpdate(user._id, { teamCode: code });

    return NextResponse.json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Teams API Error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/teams - Update team details
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
    const member = team.members.find((m: { userId: { equals: (id: any) => boolean }; role?: string }) => m.userId.equals(user._id));
    if (!member || member.role !== 'leader') {
      return NextResponse.json(
        { success: false, message: "Only team leaders can update team details" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, avatar } = body;

    const updates: any = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (avatar !== undefined) updates.avatar = avatar;

    const updatedTeam = await Team.findOneAndUpdate(
      { code: user.teamCode },
      { $set: updates },
      { new: true }
    ).populate('members.userId', 'name email profile.avatar');

    return NextResponse.json({
      success: true,
      data: updatedTeam
    });
  } catch (error) {
    console.error('Teams API Error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/teams - Delete a team
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

    // Check if user is team leader
    const member = team.members.find((m: { userId: { equals: (id: any) => boolean }; role?: string }) => m.userId.equals(user._id));
    if (!member || member.role !== 'leader') {
      return NextResponse.json(
        { success: false, message: "Only team leaders can delete the team" },
        { status: 403 }
      );
    }

    // Remove team code from all team members
    await User.updateMany(
      { teamCode: user.teamCode },
      { $unset: { teamCode: 1 } }
    );

    // Delete the team
    await Team.findOneAndDelete({ code: user.teamCode });

    return NextResponse.json({
      success: true,
      message: "Team deleted successfully"
    });
  } catch (error) {
    console.error('Teams API Error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
} 
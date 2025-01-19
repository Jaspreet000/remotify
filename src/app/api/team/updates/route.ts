import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import Team from '@/models/Team';
import User from '@/models/User';

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
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const team = await Team.findOne({ 'members.userId': user._id })
      .populate('asyncUpdates.userId', 'name image')
      .select('asyncUpdates');

    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found" },
        { status: 404 }
      );
    }

    // Sort updates by creation date
    const updates = team.asyncUpdates.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      success: true,
      data: updates
    });
  } catch (error) {
    console.error('Async updates error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { videoUrl, thumbnail, title, description, tags } = await request.json();

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const team = await Team.findOne({ 'members.userId': user._id });
    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found" },
        { status: 404 }
      );
    }

    team.asyncUpdates.push({
      userId: user._id,
      videoUrl,
      thumbnail,
      title,
      description,
      tags,
      views: [],
      reactions: [],
      createdAt: new Date()
    });

    await team.save();

    return NextResponse.json({
      success: true,
      data: team.asyncUpdates[team.asyncUpdates.length - 1]
    });
  } catch (error) {
    console.error('Create async update error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH endpoint for reactions and views
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { updateId, action, reactionType } = await request.json();

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const team = await Team.findOne({ 'members.userId': user._id });
    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found" },
        { status: 404 }
      );
    }

    const update = team.asyncUpdates.id(updateId);
    if (!update) {
      return NextResponse.json(
        { success: false, message: "Update not found" },
        { status: 404 }
      );
    }

    if (action === 'view') {
      // Add view if not already viewed
      if (!update.views.some(view => view.userId.equals(user._id))) {
        update.views.push({
          userId: user._id,
          viewedAt: new Date()
        });
      }
    } else if (action === 'react') {
      // Add or update reaction
      const existingReaction = update.reactions.find(
        reaction => reaction.userId.equals(user._id)
      );
      if (existingReaction) {
        existingReaction.type = reactionType;
        existingReaction.timestamp = new Date();
      } else {
        update.reactions.push({
          userId: user._id,
          type: reactionType,
          timestamp: new Date()
        });
      }
    }

    await team.save();

    return NextResponse.json({
      success: true,
      data: update
    });
  } catch (error) {
    console.error('Update async update error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
} 
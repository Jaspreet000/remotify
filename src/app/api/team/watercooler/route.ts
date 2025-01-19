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
      .populate('waterCoolerRooms.participants.userId', 'name image')
      .select('waterCoolerRooms');

    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: team.waterCoolerRooms
    });
  } catch (error) {
    console.error('Water cooler rooms error:', error);
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

    const { name, description, type } = await request.json();

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

    team.waterCoolerRooms.push({
      name,
      description,
      type,
      participants: [{
        userId: user._id,
        status: 'active',
        joinedAt: new Date()
      }],
      messages: []
    });

    await team.save();

    return NextResponse.json({
      success: true,
      data: team.waterCoolerRooms[team.waterCoolerRooms.length - 1]
    });
  } catch (error) {
    console.error('Create water cooler room error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
} 
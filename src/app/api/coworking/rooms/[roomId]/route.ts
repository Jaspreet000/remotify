import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const COWORKING_ROOMS = {
  'deep-work': {
    id: 'deep-work',
    name: 'Deep Work Space',
    ambientSound: 'white-noise',
    participants: [],
    focusTimer: {
      duration: 25 * 60,
      remainingTime: 25 * 60,
      isActive: false
    }
  },
  'creative-flow': {
    id: 'creative-flow',
    name: 'Creative Flow',
    ambientSound: 'nature',
    participants: [],
    focusTimer: {
      duration: 50 * 60,
      remainingTime: 50 * 60,
      isActive: false
    }
  },
  'study-group': {
    id: 'study-group',
    name: 'Study Group',
    ambientSound: 'cafe',
    participants: [],
    focusTimer: {
      duration: 25 * 60,
      remainingTime: 25 * 60,
      isActive: false
    }
  }
};

// GET /api/coworking/rooms/[roomId]
export async function GET(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const room = COWORKING_ROOMS[params.roomId as keyof typeof COWORKING_ROOMS];
    if (!room) {
      return NextResponse.json(
        { success: false, message: "Room not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Coworking room error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/coworking/rooms/[roomId]/join
export async function POST(
  request: Request,
  { params }: { params: { roomId: string } }
) {
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

    const room = COWORKING_ROOMS[params.roomId as keyof typeof COWORKING_ROOMS];
    if (!room) {
      return NextResponse.json(
        { success: false, message: "Room not found" },
        { status: 404 }
      );
    }

    // Check if user is already in another room
    Object.values(COWORKING_ROOMS).forEach(r => {
      r.participants = r.participants.filter(p => p.id !== user._id.toString());
    });

    // Add user to room
    room.participants.push({
      id: user._id.toString(),
      name: user.name,
      status: 'focusing'
    });

    return NextResponse.json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Join room error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/coworking/rooms/[roomId]/leave
export async function DELETE(
  request: Request,
  { params }: { params: { roomId: string } }
) {
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

    const room = COWORKING_ROOMS[params.roomId as keyof typeof COWORKING_ROOMS];
    if (!room) {
      return NextResponse.json(
        { success: false, message: "Room not found" },
        { status: 404 }
      );
    }

    // Remove user from room
    room.participants = room.participants.filter(p => p.id !== user._id.toString());

    return NextResponse.json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Leave room error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/coworking/rooms/[roomId]/status
export async function PATCH(
  request: Request,
  { params }: { params: { roomId: string } }
) {
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

    const room = COWORKING_ROOMS[params.roomId as keyof typeof COWORKING_ROOMS];
    if (!room) {
      return NextResponse.json(
        { success: false, message: "Room not found" },
        { status: 404 }
      );
    }

    const { status } = await request.json();
    if (!['focusing', 'break', 'idle'].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    // Update user status
    const participant = room.participants.find(p => p.id === user._id.toString());
    if (participant) {
      participant.status = status;
    }

    return NextResponse.json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Update status error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
} 
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Collaboration from "@/models/Collaboration";
import { verifyToken } from "@/lib/auth";
import mongoose from "mongoose";

interface DecodedToken {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

interface CollaborationData {
  teamId: mongoose.Types.ObjectId;
  activity: {
    date: Date;
    type: 'meeting' | 'task' | 'focus-session' | 'code-review' | 'pair-programming';
    duration: number;
    participants: { userId: mongoose.Types.ObjectId; contribution: number; }[];
    platform: 'slack' | 'google-meet' | 'zoom' | 'in-person' | 'other';
    metadata: { [key: string]: any };
  }[];
}

// GET: Fetch collaboration insights
export async function GET(request: Request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token) as DecodedToken;

    const collaborationData = await Collaboration.find({ user: decoded.id }).lean() as CollaborationData[];

    return NextResponse.json({ success: true, data: collaborationData });
  } catch (error) {
    console.error("Error fetching collaboration data:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

// POST: Add new collaboration data
export async function POST(request: Request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token) as DecodedToken;

    const { team, activity } = await request.json();

    if (!team || !activity) {
      return NextResponse.json({ success: false, message: "Invalid input data" }, { status: 400 });
    }

    const newCollaboration: CollaborationData = {
      teamId: new mongoose.Types.ObjectId(team),
      activity: [{
        date: new Date(),
        type: activity.type,
        duration: activity.duration,
        participants: activity.participants,
        platform: activity.platform,
        metadata: activity.metadata
      }]
    };

    const savedCollaboration = await Collaboration.create(newCollaboration);

    return NextResponse.json({ success: true, data: savedCollaboration });
  } catch (error) {
    console.error("Error adding collaboration data:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Collaboration from "@/models/Collaboration";
import { verifyToken } from "@/lib/auth";

interface DecodedToken {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

interface CollaborationData {
  user: string;
  team: string;
  activity: {
    type: string;
    duration: number;
    participants: string[];
    outcome: string;
  };
  timestamp: Date;
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

    const collaborationData = await Collaboration.find({ user: decoded.id }).lean();

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

    const newCollaboration = await Collaboration.create({ 
      user: decoded.id, 
      team, 
      activity,
      timestamp: new Date()
    });

    return NextResponse.json({ success: true, data: newCollaboration });
  } catch (error) {
    console.error("Error adding collaboration data:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

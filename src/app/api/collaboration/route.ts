import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { verifyToken } from "@/lib/auth";
import Team from "@/models/Team";

interface DecodedToken {
  id: string;
  email: string;
  role: string;
}

interface CollaborationSession {
  teamId: string;
  startTime: Date;
  duration: number;
  participants: string[];
  notes: string;
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const { id } = verifyToken(token) as DecodedToken;

    const sessionData: CollaborationSession = await request.json();
    const team = await Team.findById(sessionData.teamId);

    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found" },
        { status: 404 }
      );
    }

    team.sessions.push({
      ...sessionData,
      userId: id
    });

    await team.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Collaboration API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

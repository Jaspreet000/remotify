import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Collaboration from "@/models/Collaboration";
import { verifyToken } from "@/lib/auth";

// GET: Fetch collaboration insights
export async function GET(request: Request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = verifyToken(token);

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
    const decoded: any = verifyToken(token);

    const { team, activity } = await request.json();

    if (!team || !activity) {
      return NextResponse.json({ success: false, message: "Invalid input data" }, { status: 400 });
    }

    const newCollaboration = await Collaboration.create({ user: decoded.id, team, activity });

    return NextResponse.json({ success: true, data: newCollaboration });
  } catch (error) {
    console.error("Error adding collaboration data:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

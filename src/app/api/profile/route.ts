import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const userDoc = await User.findOne({ email: session.user.email });
    
    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Get user stats from related collections if needed
    // This is a placeholder for stats - implement actual stats gathering logic
    const stats = {
      totalSessions: 0,
      totalFocusTime: 0,
      averageFocusScore: 0,
      streakDays: 0,
      level: 1,
      achievements: [],
    };

    return NextResponse.json({
      success: true,
      user: {
        name: userDoc.name,
        email: userDoc.email,
        profile: {
          bio: userDoc.profile?.bio || "",
          avatar: userDoc.profile?.avatar || "",
          socialLinks: userDoc.profile?.socialLinks || {},
          goals: userDoc.profile?.goals || [],
        },
      },
      stats,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    await dbConnect();

    const userDoc = await User.findOne({ email: session.user.email });
    
    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Update profile fields
    userDoc.profile = {
      ...userDoc.profile,
      bio: body.bio,
      goals: body.goals,
      socialLinks: body.socialLinks,
    };

    await userDoc.save();

    return NextResponse.json({
      success: true,
      profile: userDoc.profile,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { suggestBreakActivity } from '@/lib/aiService';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userData = await request.json();
    const suggestion = await suggestBreakActivity(userData);

    if (!suggestion) {
      return NextResponse.json(
        { success: false, message: "Failed to generate break suggestion" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      suggestion
    });
  } catch (error) {
    console.error('Break suggestion error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
} 
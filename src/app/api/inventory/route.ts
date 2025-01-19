import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/inventory - Get user's inventory
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

    return NextResponse.json({
      success: true,
      data: {
        inventory: user.inventory || {
          badges: [],
          titles: [],
          powerUps: []
        },
        equipped: {
          badge: user.profile?.badge,
          title: user.profile?.title
        }
      }
    });
  } catch (error) {
    console.error('Inventory Error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/inventory/equip - Equip a badge or title
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
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { type, itemId } = body;

    if (!type || !itemId || !['badge', 'title'].includes(type)) {
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      );
    }

    // Check if user owns the item
    const inventory = user.inventory || { badges: [], titles: [], powerUps: [] };
    const hasItem = type === 'badge' 
      ? inventory.badges?.includes(itemId)
      : inventory.titles?.includes(itemId);

    if (!hasItem) {
      return NextResponse.json(
        { success: false, message: `You don't own this ${type}` },
        { status: 400 }
      );
    }

    // Update equipped item
    if (type === 'badge') {
      user.profile.badge = itemId;
    } else {
      user.profile.title = itemId;
    }

    await user.save();

    return NextResponse.json({
      success: true,
      data: {
        equipped: {
          badge: user.profile.badge,
          title: user.profile.title
        }
      }
    });
  } catch (error) {
    console.error('Equip Item Error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory/unequip - Unequip a badge or title
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
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { type } = body;

    if (!type || !['badge', 'title'].includes(type)) {
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      );
    }

    // Remove equipped item
    if (type === 'badge') {
      user.profile.badge = undefined;
    } else {
      user.profile.title = undefined;
    }

    await user.save();

    return NextResponse.json({
      success: true,
      data: {
        equipped: {
          badge: user.profile.badge,
          title: user.profile.title
        }
      }
    });
  } catch (error) {
    console.error('Unequip Item Error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
} 
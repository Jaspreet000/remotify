import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const POWER_UPS = {
  xp_boost_small: {
    id: 'xp_boost_small',
    name: 'Small XP Boost',
    type: 'xp_boost',
    multiplier: 1.5,
    duration: 3600000, // 1 hour
    cost: 100
  },
  xp_boost_large: {
    id: 'xp_boost_large',
    name: 'Large XP Boost',
    type: 'xp_boost',
    multiplier: 2,
    duration: 7200000, // 2 hours
    cost: 250
  },
  coin_boost_small: {
    id: 'coin_boost_small',
    name: 'Small Coin Boost',
    type: 'coin_boost',
    multiplier: 1.5,
    duration: 3600000, // 1 hour
    cost: 150
  },
  coin_boost_large: {
    id: 'coin_boost_large',
    name: 'Large Coin Boost',
    type: 'coin_boost',
    multiplier: 2,
    duration: 7200000, // 2 hours
    cost: 300
  },
  all_boost: {
    id: 'all_boost',
    name: 'Ultimate Boost',
    type: 'all_boost',
    multiplier: 1.75,
    duration: 3600000, // 1 hour
    cost: 500
  }
};

// GET /api/powerups - Get available power-ups and user's inventory
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

    // Check and remove expired power-ups
    await user.checkPowerUps();

    return NextResponse.json({
      success: true,
      data: {
        available: POWER_UPS,
        inventory: user.inventory?.powerUps || [],
        active: user.activePowerUps || [],
        coins: user.stats.coins || 0
      }
    });
  } catch (error) {
    console.error('Power-ups Error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/powerups - Purchase or use a power-up
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
    const { action, powerUpId } = body;

    if (!action || !powerUpId || !['purchase', 'use'].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      );
    }

    const powerUp = POWER_UPS[powerUpId as keyof typeof POWER_UPS];
    if (!powerUp) {
      return NextResponse.json(
        { success: false, message: "Invalid power-up ID" },
        { status: 400 }
      );
    }

    if (action === 'purchase') {
      // Check if user has enough coins
      if ((user.stats.coins || 0) < powerUp.cost) {
        return NextResponse.json(
          { success: false, message: "Insufficient coins" },
          { status: 400 }
        );
      }

      // Deduct coins and add power-up to inventory
      user.stats.coins = (user.stats.coins || 0) - powerUp.cost;
      user.inventory.powerUps = [
        ...(user.inventory.powerUps || []),
        {
          ...powerUp,
          purchasedAt: new Date()
        }
      ];

      await user.save();

      return NextResponse.json({
        success: true,
        data: {
          inventory: user.inventory.powerUps,
          coins: user.stats.coins
        }
      });
    } else if (action === 'use') {
      // Check if user has the power-up in inventory
      const powerUpIndex = user.inventory.powerUps?.findIndex((p: { id: string }) => p.id === powerUpId);
      if (powerUpIndex === -1) {
        return NextResponse.json(
          { success: false, message: "Power-up not in inventory" },
          { status: 400 }
        );
      }

      // Remove from inventory and add to active power-ups
      const [userPowerUp] = user.inventory.powerUps.splice(powerUpIndex, 1);
      user.activePowerUps = [
        ...(user.activePowerUps || []),
        {
          ...powerUp,
          expiresAt: new Date(Date.now() + powerUp.duration)
        }
      ];

      await user.save();

      return NextResponse.json({
        success: true,
        data: {
          inventory: user.inventory.powerUps,
          active: user.activePowerUps
        }
      });
    }
  } catch (error) {
    console.error('Power-ups Error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
} 
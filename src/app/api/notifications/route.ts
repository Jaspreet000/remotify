import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface Notification {
  id: string;
  type: 'achievement' | 'level_up' | 'quest_complete' | 'streak' | 'team_invite' | 'team_challenge';
  title: string;
  message: string;
  icon?: string;
  rewards?: {
    xp?: number;
    coins?: number;
    badge?: string;
    title?: string;
  };
  achievement?: {
    id: string;
    name: string;
    description: string;
    icon: string;
  };
  createdAt: Date;
  read: boolean;
}

// GET /api/notifications - Get user's notifications
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

    // Get notifications and sort by date
    const notifications = (user.notifications || [])
      .sort((a: Notification, b: Notification) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    // Count unread notifications
    const unreadCount = notifications.filter((n: Notification) => !n.read).length;

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Notifications Error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Add a new notification
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
    const { type, title, message, icon, rewards, achievement } = body;

    if (!type || !title || !message) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create new notification
    const notification: Notification = {
      id: `${type}_${Date.now()}`,
      type,
      title,
      message,
      icon,
      rewards,
      achievement,
      createdAt: new Date(),
      read: false
    };

    // Add to user's notifications
    user.notifications = [notification, ...(user.notifications || [])];

    // Limit to last 50 notifications
    if (user.notifications.length > 50) {
      user.notifications = user.notifications.slice(0, 50);
    }

    await user.save();

    return NextResponse.json({
      success: true,
      data: {
        notification
      }
    });
  } catch (error) {
    console.error('Add Notification Error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications/read - Mark notifications as read
export async function PATCH(request: Request) {
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
    const { notificationIds } = body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { success: false, message: "Invalid notification IDs" },
        { status: 400 }
      );
    }

    // Mark specified notifications as read
    user.notifications = user.notifications.map((notification: Notification) => {
      if (notificationIds.includes(notification.id)) {
        return { ...notification, read: true };
      }
      return notification;
    });

    await user.save();

    return NextResponse.json({
      success: true,
      data: {
        unreadCount: user.notifications.filter((n: Notification) => !n.read).length
      }
    });
  } catch (error) {
    console.error('Mark Read Error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications - Delete notifications
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
    const { notificationIds } = body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { success: false, message: "Invalid notification IDs" },
        { status: 400 }
      );
    }

    // Remove specified notifications
    user.notifications = user.notifications.filter(
      (notification: Notification) => !notificationIds.includes(notification.id)
    );

    await user.save();

    return NextResponse.json({
      success: true,
      data: {
        remainingCount: user.notifications.length
      }
    });
  } catch (error) {
    console.error('Delete Notifications Error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
} 
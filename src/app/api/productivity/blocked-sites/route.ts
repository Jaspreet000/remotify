import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user.blockedSites || [],
    });
  } catch (error) {
    console.error('Error in GET /api/productivity/blocked-sites:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { url } = await req.json();
    if (!url) {
      return NextResponse.json(
        { success: false, message: 'URL is required' },
        { status: 400 }
      );
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const newSite = { url, isBlocked: true };
    if (!user.blockedSites) {
      user.blockedSites = [];
    }
    user.blockedSites.push(newSite);
    await user.save();

    return NextResponse.json({
      success: true,
      data: newSite,
    });
  } catch (error) {
    console.error('Error in POST /api/productivity/blocked-sites:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { url, isBlocked } = await req.json();
    if (!url) {
      return NextResponse.json(
        { success: false, message: 'URL is required' },
        { status: 400 }
      );
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const siteIndex = user.blockedSites?.findIndex((site) => site.url === url);
    if (siteIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Site not found' },
        { status: 404 }
      );
    }

    user.blockedSites[siteIndex].isBlocked = isBlocked;
    await user.save();

    return NextResponse.json({
      success: true,
      data: user.blockedSites[siteIndex],
    });
  } catch (error) {
    console.error('Error in PATCH /api/productivity/blocked-sites:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 
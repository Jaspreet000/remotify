import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import User from '@/models/User';
import FocusSession from '@/models/FocusSession';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token) as { id: string };

    // Fetch user data and focus sessions
    const user = await User.findById(decoded.id).select('-password');
    const sessions = await FocusSession.find({ userId: decoded.id });

    const exportData = {
      userData: {
        name: user.name,
        email: user.email,
        settings: user.settings,
        stats: user.stats,
      },
      focusSessions: sessions.map(session => ({
        date: session.startTime,
        duration: session.duration,
        focusScore: session.focusScore,
        breaks: session.breaks,
        distractions: session.distractions,
      })),
    };

    if (format === 'csv') {
      const csvContent = generateCSV(exportData);
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=focus-data.csv',
        },
      });
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename=focus-data.json',
      },
    });
  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { success: false, message: 'Export failed' },
      { status: 500 }
    );
  }
}

function generateCSV(data: any) {
  const focusSessionRows = data.focusSessions.map((session: any) => ({
    date: new Date(session.date).toISOString(),
    duration: session.duration,
    focusScore: session.focusScore,
    breaks: session.breaks.length,
    distractions: session.distractions.length,
  }));

  const headers = Object.keys(focusSessionRows[0]).join(',');
  const rows = focusSessionRows.map(row => Object.values(row).join(',')).join('\n');

  return `${headers}\n${rows}`;
} 
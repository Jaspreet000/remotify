// src/app/api/habits/route.ts
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import HabitLog from '@/models/HabitLog';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

interface HabitLogInput {
  taskName: string;
  duration: number;
  breaks: number;
  distractions: number;
}

export async function POST(req: Request) {
  try {
    await dbConnect();

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'default_secret_key'
    ) as DecodedToken;
    
    const userId = decoded.id;

    const body = await req.json() as HabitLogInput;
    const { taskName, duration, breaks, distractions } = body;

    if (!taskName || !duration) {
      return NextResponse.json(
        { success: false, message: 'Task name and duration are required' },
        { status: 400 }
      );
    }

    const habitLog = await HabitLog.create({
      userId,
      taskName,
      duration,
      breaks: breaks || 0,
      distractions: distractions || 0,
    });

    return NextResponse.json({ success: true, habitLog });
  } catch (error) {
    console.error('Error in habit logging:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

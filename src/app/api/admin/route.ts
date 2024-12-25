import { NextResponse } from 'next/server';
import {dbConnect} from '@/lib/dbConnect';
import Admin from '@/models/Admin';
import { verifyToken } from '@/lib/auth';

// Middleware to verify admin role
const verifyAdmin = async (token: string | undefined) => {
  if (!token) {
    throw new Error('Authorization token is missing');
  }

  const decoded: any = verifyToken(token);
  if (decoded.role !== 'admin') {
    throw new Error('Unauthorized: Admin privileges required');
  }

  return decoded;
};

// GET: Fetch admin data
export async function GET(request: Request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, message: 'Authorization header missing' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    await verifyAdmin(token);

    const adminData = await Admin.findOne();
    if (!adminData) {
      return NextResponse.json({ success: false, message: 'Admin data not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: adminData });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message: errorMessage }, { status: 403 });
  }
}

// POST: Update platform settings
export async function POST(request: Request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, message: 'Authorization header missing' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    await verifyAdmin(token);

    const updates = await request.json();
    const updatedAdmin = await Admin.findOneAndUpdate({}, updates, { new: true });
    if (!updatedAdmin) {
      return NextResponse.json({ success: false, message: 'Admin data not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedAdmin });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message: errorMessage }, { status: 403 });
  }
}

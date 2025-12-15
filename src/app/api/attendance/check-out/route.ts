import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { checkOutSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const result = checkOutSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { latitude, longitude, address } = result.data;

    // Get today's date (without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if checked in today
    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: session.userId,
          date: today,
        },
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { success: false, error: 'Not checked in today' },
        { status: 400 }
      );
    }

    if (!attendance.checkInTime) {
      return NextResponse.json(
        { success: false, error: 'Not checked in today' },
        { status: 400 }
      );
    }

    if (attendance.checkOutTime) {
      return NextResponse.json(
        { success: false, error: 'Already checked out today' },
        { status: 400 }
      );
    }

    const now = new Date();
    const workHours = (now.getTime() - new Date(attendance.checkInTime).getTime()) / (1000 * 60 * 60);

    // Update attendance record
    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOutTime: now,
        checkOutLat: latitude,
        checkOutLng: longitude,
        checkOutAddr: address,
        workHours: Math.round(workHours * 100) / 100,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Checked out successfully',
    });
  } catch (error) {
    console.error('Check-out error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

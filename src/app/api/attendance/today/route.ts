import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getISTToday } from '@/lib/utils';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get today's date in IST
    const today = getISTToday();

    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: session.userId,
          date: today,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        isCheckedIn: !!attendance?.checkInTime,
        isCheckedOut: !!attendance?.checkOutTime,
        checkInTime: attendance?.checkInTime,
        checkOutTime: attendance?.checkOutTime,
        status: attendance?.status || null,
        workHours: attendance?.workHours || null,
      },
    });
  } catch (error) {
    console.error('Get today status error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

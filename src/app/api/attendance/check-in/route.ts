import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { checkInSchema } from '@/lib/validations';
import { getISTToday } from '@/lib/utils';

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
    const result = checkInSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { latitude, longitude, address } = result.data;

    // Get current time (will be stored as UTC by PostgreSQL)
    const now = new Date();

    // Get today's date in IST for querying and late calculation
    const today = getISTToday();

    // Check if already checked in today
    const existing = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: session.userId,
          date: today,
        },
      },
    });

    if (existing?.checkInTime) {
      return NextResponse.json(
        { success: false, error: 'Already checked in today' },
        { status: 400 }
      );
    }

    // Get work start time setting
    const startTimeSetting = await prisma.setting.findUnique({
      where: { key: 'work_start_time' },
    });
    const lateThresholdSetting = await prisma.setting.findUnique({
      where: { key: 'late_threshold_minutes' },
    });

    const workStartTime = startTimeSetting?.value || '09:00';
    const lateThreshold = parseInt(lateThresholdSetting?.value || '15');

    // Calculate if late - compare in IST timezone
    // Convert current UTC time to IST for comparison
    const nowIST = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    const [startHour, startMin] = workStartTime.split(':').map(Number);
    const startDateTime = new Date(today);
    startDateTime.setHours(startHour, startMin + lateThreshold, 0, 0);

    const isLate = nowIST > startDateTime;

    // Create or update attendance record
    const attendance = await prisma.attendance.upsert({
      where: {
        userId_date: {
          userId: session.userId,
          date: today,
        },
      },
      create: {
        userId: session.userId,
        date: today,
        checkInTime: now,
        checkInLat: latitude,
        checkInLng: longitude,
        checkInAddr: address,
        status: isLate ? 'LATE' : 'ON_TIME',
      },
      update: {
        checkInTime: now,
        checkInLat: latitude,
        checkInLng: longitude,
        checkInAddr: address,
        status: isLate ? 'LATE' : 'ON_TIME',
      },
    });

    return NextResponse.json({
      success: true,
      data: attendance,
      message: isLate ? 'Checked in (Late)' : 'Checked in successfully',
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession, isAdmin } from '@/lib/auth';
import { getISTToday } from '@/lib/utils';

interface AttendanceRecord {
  date: Date;
  status: string;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  user: {
    id: string;
    name: string;
    department: string | null;
    avatar?: string | null;
  };
}

interface DepartmentGroup {
  department: string | null;
  _count: { _all: number };
}

interface AttendanceGroup {
  userId: string;
  _count: { _all: number };
}

export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!isAdmin(session)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month';

    const today = getISTToday();

    // Get total employees
    const totalEmployees = await prisma.user.count({
      where: { role: 'EMPLOYEE', isActive: true },
    });

    // Get today's attendance
    const todayAttendance = await prisma.attendance.findMany({
      where: { date: today },
      include: {
        user: {
          select: { id: true, name: true, department: true },
        },
      },
    });

    const presentToday = todayAttendance.filter((a: AttendanceRecord) => a.checkInTime).length;
    const lateToday = todayAttendance.filter((a: AttendanceRecord) => a.status === 'LATE').length;
    const absentToday = totalEmployees - presentToday;

    // Calculate average times
    const checkInTimes = todayAttendance
      .filter((a: AttendanceRecord) => a.checkInTime)
      .map((a: AttendanceRecord) => {
        const d = new Date(a.checkInTime!);
        return d.getHours() * 60 + d.getMinutes();
      });

    const checkOutTimes = todayAttendance
      .filter((a: AttendanceRecord) => a.checkOutTime)
      .map((a: AttendanceRecord) => {
        const d = new Date(a.checkOutTime!);
        return d.getHours() * 60 + d.getMinutes();
      });

    let avgCheckIn = '--:--';
    let avgCheckOut = '--:--';

    if (checkInTimes.length > 0) {
      const avg = Math.round(checkInTimes.reduce((a: number, b: number) => a + b, 0) / checkInTimes.length);
      avgCheckIn = `${String(Math.floor(avg / 60)).padStart(2, '0')}:${String(avg % 60).padStart(2, '0')}`;
    }

    if (checkOutTimes.length > 0) {
      const avg = Math.round(checkOutTimes.reduce((a: number, b: number) => a + b, 0) / checkOutTimes.length);
      avgCheckOut = `${String(Math.floor(avg / 60)).padStart(2, '0')}:${String(avg % 60).padStart(2, '0')}`;
    }

    // Get weekly attendance trend (last 7 days)
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 6);

    const weeklyAttendance = await prisma.attendance.findMany({
      where: {
        date: {
          gte: weekStart,
          lte: today,
        },
      },
      select: {
        date: true,
        status: true,
      },
    });

    // Group by date for weekly trend
    const weeklyTrendMap = new Map<string, { present: number; late: number; absent: number }>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      weeklyTrendMap.set(dateStr, { present: 0, late: 0, absent: 0 });
    }

    weeklyAttendance.forEach((a: { date: Date; status: string }) => {
      const dateStr = new Date(a.date).toISOString().split('T')[0];
      const entry = weeklyTrendMap.get(dateStr);
      if (entry) {
        if (a.status === 'ON_TIME') entry.present++;
        else if (a.status === 'LATE') entry.late++;
        else if (a.status === 'ABSENT') entry.absent++;
      }
    });

    const weeklyTrend = Array.from(weeklyTrendMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));

    // Get department stats with today's presence
    const departments = await prisma.user.groupBy({
      by: ['department'],
      where: { role: 'EMPLOYEE', isActive: true },
      _count: { _all: true },
    });

    const departmentData = await Promise.all(
      departments.map(async (dept: DepartmentGroup) => {
        const presentInDept = todayAttendance.filter(
          (a: AttendanceRecord) => a.user.department === dept.department && a.checkInTime
        ).length;
        return {
          name: dept.department || 'Unassigned',
          count: dept._count._all,
          presentToday: presentInDept,
        };
      })
    );

    // Get top performers (highest on-time rate)
    const rangeStart = new Date(today);
    if (range === 'week') rangeStart.setDate(rangeStart.getDate() - 7);
    else if (range === 'month') rangeStart.setMonth(rangeStart.getMonth() - 1);
    else rangeStart.setMonth(rangeStart.getMonth() - 3);

    const employeeAttendance = await prisma.attendance.groupBy({
      by: ['userId'],
      where: {
        date: { gte: rangeStart, lte: today },
      },
      _count: { _all: true },
    });

    const onTimeByUser = await prisma.attendance.groupBy({
      by: ['userId'],
      where: {
        date: { gte: rangeStart, lte: today },
        status: 'ON_TIME',
      },
      _count: { _all: true },
    });

    const onTimeMap = new Map<string, number>(onTimeByUser.map((u: AttendanceGroup) => [u.userId, u._count._all]));
    const performerIds = employeeAttendance
      .map((e: AttendanceGroup) => {
        const onTimeCount = onTimeMap.get(e.userId) || 0;
        return {
          userId: e.userId,
          total: e._count._all,
          onTime: onTimeCount,
          rate: Math.round((onTimeCount / e._count._all) * 100),
        };
      })
      .sort((a: { rate: number }, b: { rate: number }) => b.rate - a.rate)
      .slice(0, 5);

    const topPerformersData = await prisma.user.findMany({
      where: { id: { in: performerIds.map((p: { userId: string }) => p.userId) } },
      select: { id: true, name: true, department: true },
    });

    const topPerformers = performerIds.map((p: { userId: string; rate: number }) => {
      const user = topPerformersData.find((u: { id: string; name: string; department: string | null }) => u.id === p.userId);
      return {
        name: user?.name || 'Unknown',
        department: user?.department || 'No Department',
        onTimeRate: p.rate,
      };
    });

    // Monthly stats (last 6 months)
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);

      const monthAttendance = await prisma.attendance.findMany({
        where: {
          date: { gte: monthStart, lte: monthEnd },
        },
      });

      const totalRecords = monthAttendance.length;
      const onTimeRecords = monthAttendance.filter((a: { status: string }) => a.status === 'ON_TIME').length;
      const lateRecords = monthAttendance.filter((a: { status: string }) => a.status === 'LATE').length;

      monthlyStats.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        avgAttendance: totalRecords > 0 ? Math.round(((onTimeRecords + lateRecords) / (totalEmployees || 1)) * 100) : 0,
        avgLate: totalRecords > 0 ? Math.round((lateRecords / totalRecords) * 100) : 0,
      });
    }

    // Recent attendance
    const recentAttendance = await prisma.attendance.findMany({
      where: { date: today },
      take: 5,
      orderBy: { checkInTime: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            department: true,
            avatar: true,
          },
        },
      },
    });

    // Return data in format expected by analytics page
    return NextResponse.json({
      totalEmployees,
      presentToday,
      absentToday,
      lateToday,
      attendanceRate: totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0,
      avgCheckIn,
      avgCheckOut,
      weeklyTrend,
      departments: departmentData,
      topPerformers,
      monthlyStats,
      recentAttendance,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

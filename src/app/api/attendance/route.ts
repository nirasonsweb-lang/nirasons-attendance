import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession, isAdmin } from '@/lib/auth';

// GET /api/attendance - Get attendance records
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const department = searchParams.get('department');

    // Employees can only view their own attendance
    const isAdminUser = isAdmin(session);
    const targetUserId = isAdminUser && userId ? userId : (isAdminUser ? undefined : session.userId);

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    // User filter
    if (targetUserId) {
      where.userId = targetUserId;
    }

    // Date range filter
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (date) {
      // Single date filter
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      where.date = d;
    }

    // Status filter
    if (status) {
      where.status = status as 'ON_TIME' | 'LATE' | 'ABSENT' | 'HALF_DAY';
    }

    // Search and department filter (requires user relation)
    if (search || department) {
      where.user = {};
      
      if (search) {
        where.user.name = {
          contains: search,
          mode: 'insensitive',
        };
      }
      
      if (department) {
        where.user.department = department;
      }
    }

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
              position: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.attendance.count({ where }),
    ]);

    return NextResponse.json({
      attendance: records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession, isAdmin } from '@/lib/auth';
import { updateEmployeeSchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/employees/[id] - Get single employee
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    const { id } = await params;
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Employees can only view themselves, admins can view anyone
    if (!isAdmin(session) && session.userId !== id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const employee = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        department: true,
        position: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { attendances: true },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Get attendance stats
    const today = new Date();
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    
    const attendanceStats = await prisma.attendance.aggregate({
      where: {
        userId: id,
        date: { gte: firstDayOfYear },
      },
      _avg: {
        workHours: true,
      },
      _count: {
        _all: true,
      },
    });

    // Get average check-in and check-out times
    const avgTimes = await prisma.attendance.findMany({
      where: {
        userId: id,
        date: { gte: firstDayOfYear },
        checkInTime: { not: null },
      },
      select: {
        checkInTime: true,
        checkOutTime: true,
      },
    });

    let avgCheckIn = '--:--';
    let avgCheckOut = '--:--';

    interface TimeRecord {
      checkInTime: Date | null;
      checkOutTime: Date | null;
    }

    if (avgTimes.length > 0) {
      const checkInMinutes = avgTimes
        .filter((a: TimeRecord) => a.checkInTime)
        .map((a: TimeRecord) => {
          const d = new Date(a.checkInTime!);
          return d.getHours() * 60 + d.getMinutes();
        });
      
      const checkOutMinutes = avgTimes
        .filter((a: TimeRecord) => a.checkOutTime)
        .map((a: TimeRecord) => {
          const d = new Date(a.checkOutTime!);
          return d.getHours() * 60 + d.getMinutes();
        });

      if (checkInMinutes.length > 0) {
        const avgIn = Math.round(checkInMinutes.reduce((a: number, b: number) => a + b, 0) / checkInMinutes.length);
        avgCheckIn = `${String(Math.floor(avgIn / 60)).padStart(2, '0')}:${String(avgIn % 60).padStart(2, '0')}`;
      }

      if (checkOutMinutes.length > 0) {
        const avgOut = Math.round(checkOutMinutes.reduce((a: number, b: number) => a + b, 0) / checkOutMinutes.length);
        avgCheckOut = `${String(Math.floor(avgOut / 60)).padStart(2, '0')}:${String(avgOut % 60).padStart(2, '0')}`;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...employee,
        stats: {
          totalAttendance: attendanceStats._count._all,
          avgWorkHours: attendanceStats._avg.workHours || 0,
          avgCheckIn,
          avgCheckOut,
        },
      },
    });
  } catch (error) {
    console.error('Get employee error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/employees/[id] - Update employee
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    const { id } = await params;
    
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

    const body = await request.json();
    
    // Validate input
    const result = updateEmployeeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const employee = await prisma.user.update({
      where: { id },
      data: result.data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        department: true,
        position: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error('Update employee error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/employees/[id] - Delete employee
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    const { id } = await params;
    
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

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Employee deleted successfully',
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

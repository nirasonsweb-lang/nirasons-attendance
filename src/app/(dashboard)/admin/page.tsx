import { redirect } from 'next/navigation';
import { getSession, isAdmin } from '@/lib/auth';
import prisma from '@/lib/db';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, Badge } from '@/components/ui';
import { formatTime, getISTToday } from '@/lib/utils';

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function AdminDashboard() {
  const session = await getSession();

  if (!session || !isAdmin(session)) {
    redirect('/');
  }

  const today = getISTToday();

  // Get stats
  const [totalEmployees, todayAttendance, departments] = await Promise.all([
    prisma.user.count({ where: { role: 'EMPLOYEE', isActive: true } }),
    prisma.attendance.findMany({
      where: { date: today },
      select: {
        id: true,
        checkInTime: true,
        checkOutTime: true,
        checkInAddr: true,
        status: true,
        user: {
          select: { id: true, name: true, department: true, position: true, avatar: true },
        },
      },
      orderBy: { checkInTime: 'desc' },
    }),
    prisma.user.groupBy({
      by: ['department'],
      where: { role: 'EMPLOYEE', isActive: true },
      _count: { _all: true },
    }),
  ]);

  const presentToday = todayAttendance.filter((a: any) => a.checkInTime).length;
  const lateToday = todayAttendance.filter((a: any) => a.status === 'LATE').length;
  const absentToday = totalEmployees - presentToday;
  const attendanceRate = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;

  // Calculate average times (convert to IST for display)
  const checkInTimes = todayAttendance
    .filter((a: any) => a.checkInTime)
    .map((a: any) => {
      // Convert to IST by creating a date and formatting in Asia/Kolkata timezone
      const date = new Date(a.checkInTime!);
      const istTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Kolkata'
      });
      const [hours, minutes] = istTime.split(':').map(Number);
      return hours * 60 + minutes;
    });

  let avgCheckIn = '--:--';
  if (checkInTimes.length > 0) {
    const avg = Math.round(checkInTimes.reduce((a: number, b: number) => a + b, 0) / checkInTimes.length);
    avgCheckIn = `${String(Math.floor(avg / 60)).padStart(2, '0')}:${String(avg % 60).padStart(2, '0')}`;
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Employees"
          value={totalEmployees}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <StatCard
          label="Present Today"
          value={presentToday}
          sublabel={`${attendanceRate}%`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Late Today"
          value={lateToday}
          icon={
            <svg className="w-6 h-6 text-status-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Absent Today"
          value={absentToday}
          icon={
            <svg className="w-6 h-6 text-status-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Attendance */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Today&apos;s Attendance</h2>
            <span className="text-sm text-gray-400">Avg Check-in: {avgCheckIn}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-500">
                  <th className="table-header pb-3">Employee</th>
                  <th className="table-header pb-3">Department</th>
                  <th className="table-header pb-3">Check In</th>
                  <th className="table-header pb-3">Check Out</th>
                  <th className="table-header pb-3">Status</th>
                  <th className="table-header pb-3">Location</th>
                </tr>
              </thead>
              <tbody>
                {todayAttendance.slice(0, 8).map((record: any) => (
                  <tr key={record.id} className="border-b border-dark-600 last:border-0">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary text-sm font-medium">
                          {record.user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-white">{record.user.name}</p>
                          <p className="text-xs text-gray-500">{record.user.position}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">{record.user.department || '-'}</td>
                    <td className="table-cell font-mono">{formatTime(record.checkInTime)}</td>
                    <td className="table-cell font-mono">{formatTime(record.checkOutTime)}</td>
                    <td className="table-cell">
                      <Badge variant={record.status === 'ON_TIME' ? 'success' : record.status === 'LATE' ? 'warning' : 'default'}>
                        {record.status === 'ON_TIME' ? 'On Time' : record.status === 'LATE' ? 'Late' : 'Absent'}
                      </Badge>
                    </td>
                    <td className="table-cell text-white text-sm max-w-[150px] truncate" title={record.checkInAddr || '-'}>
                      {record.checkInAddr || '-'}
                    </td>
                  </tr>
                ))}
                {todayAttendance.length === 0 && (
                  <tr>
                    <td colSpan={6} className="table-cell text-center text-gray-500 py-8">
                      No attendance records for today
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Department Overview */}
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Departments</h2>
          <div className="space-y-3">
            {departments.map((dept: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-dark-600 rounded-lg">
                <span className="text-gray-300">{dept.department || 'Unassigned'}</span>
                <span className="text-white font-medium">{dept._count._all}</span>
              </div>
            ))}
            {departments.length === 0 && (
              <p className="text-center text-gray-500 py-4">No departments found</p>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <a href="/admin/employees" className="btn btn-secondary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Add Employee
          </a>
          <a href="/admin/attendance" className="btn btn-secondary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Reports
          </a>
          <a href="/admin/settings" className="btn btn-secondary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </a>
        </div>
      </Card>
    </div>
  );
}

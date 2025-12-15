'use client';

import { useState, useEffect } from 'react';
import { Badge, Spinner, EmptyState } from '@/components/ui';
import { formatDate, formatTime, getStatusColor } from '@/lib/utils';

interface AttendanceRecord {
  id: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: 'ON_TIME' | 'LATE' | 'ABSENT' | 'HALF_DAY';
  workHours: number | null;
  checkInAddress: string | null;
  checkOutAddress: string | null;
}

export default function EmployeeAttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [month, setMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filter !== 'all') {
          params.append('status', filter);
        }
        if (month) {
          const [year, monthNum] = month.split('-');
          const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
          const endDate = new Date(parseInt(year), parseInt(monthNum), 0);
          params.append('startDate', startDate.toISOString().split('T')[0]);
          params.append('endDate', endDate.toISOString().split('T')[0]);
        }
        
        const res = await fetch(`/api/attendance?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setAttendance(data.attendance || []);
        }
      } catch (error) {
        console.error('Failed to fetch attendance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [filter, month]);

  const stats = {
    total: attendance.length,
    onTime: attendance.filter(a => a.status === 'ON_TIME').length,
    late: attendance.filter(a => a.status === 'LATE').length,
    absent: attendance.filter(a => a.status === 'ABSENT').length,
    avgHours: attendance.length > 0
      ? (attendance.reduce((sum, a) => sum + (a.workHours || 0), 0) / attendance.filter(a => a.workHours).length).toFixed(1)
      : '0',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Attendance</h1>
        <p className="text-dark-300 mt-1">View your complete attendance history</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-dark-800 rounded-xl p-4">
          <p className="text-dark-400 text-sm">Total Days</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-dark-800 rounded-xl p-4">
          <p className="text-dark-400 text-sm">On Time</p>
          <p className="text-2xl font-bold text-green-500 mt-1">{stats.onTime}</p>
        </div>
        <div className="bg-dark-800 rounded-xl p-4">
          <p className="text-dark-400 text-sm">Late</p>
          <p className="text-2xl font-bold text-yellow-500 mt-1">{stats.late}</p>
        </div>
        <div className="bg-dark-800 rounded-xl p-4">
          <p className="text-dark-400 text-sm">Absent</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{stats.absent}</p>
        </div>
        <div className="bg-dark-800 rounded-xl p-4">
          <p className="text-dark-400 text-sm">Avg Hours</p>
          <p className="text-2xl font-bold text-accent mt-1">{stats.avgHours}h</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-dark-800 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="text-dark-400 text-sm block mb-1">Month</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-dark-400 text-sm block mb-1">Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent"
            >
              <option value="all">All Status</option>
              <option value="ON_TIME">On Time</option>
              <option value="LATE">Late</option>
              <option value="ABSENT">Absent</option>
              <option value="HALF_DAY">Half Day</option>
            </select>
          </div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-dark-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : attendance.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              title="No attendance records found"
              description="No records match your current filters"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-700">
                <tr>
                  <th className="text-left text-dark-300 font-medium px-6 py-4">Date</th>
                  <th className="text-left text-dark-300 font-medium px-6 py-4">Check In</th>
                  <th className="text-left text-dark-300 font-medium px-6 py-4">Check Out</th>
                  <th className="text-left text-dark-300 font-medium px-6 py-4">Work Hours</th>
                  <th className="text-left text-dark-300 font-medium px-6 py-4">Status</th>
                  <th className="text-left text-dark-300 font-medium px-6 py-4">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {attendance.map((record) => (
                  <tr key={record.id} className="hover:bg-dark-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">{formatDate(record.date)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-dark-200">
                        {record.checkInTime ? formatTime(record.checkInTime) : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-dark-200">
                        {record.checkOutTime ? formatTime(record.checkOutTime) : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-dark-200">
                        {record.workHours ? `${record.workHours.toFixed(1)}h` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusColor(record.status) as 'default' | 'success' | 'warning' | 'error'}>
                        {record.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {record.checkInAddress ? (
                        <span className="text-dark-400 text-sm truncate max-w-[200px] block" title={record.checkInAddress}>
                          {record.checkInAddress}
                        </span>
                      ) : (
                        <span className="text-dark-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

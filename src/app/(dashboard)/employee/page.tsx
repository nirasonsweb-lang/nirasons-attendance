'use client';

import { useState, useEffect } from 'react';
import { CheckInOut } from '@/components/dashboard/CheckInOut';
import { AttendanceCard } from '@/components/dashboard/AttendanceCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { Spinner, Badge, EmptyState } from '@/components/ui';
import { formatDate, formatTime } from '@/lib/utils';

interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: 'ON_TIME' | 'LATE' | 'ABSENT' | 'HALF_DAY';
  workHours: number | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
}

export default function EmployeeDashboard() {
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({
    totalDays: 0,
    onTime: 0,
    late: 0,
    absent: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [attendanceRes, tasksRes] = await Promise.all([
        fetch('/api/attendance?limit=7'),
        fetch('/api/tasks?limit=5'),
      ]);

      if (attendanceRes.ok) {
        const data = await attendanceRes.json();
        setRecentAttendance(data.attendance || []);
        
        // Calculate stats from all attendance
        const allAttendance = data.attendance || [];
        setStats({
          totalDays: allAttendance.length,
          onTime: allAttendance.filter((a: AttendanceRecord) => a.status === 'ON_TIME').length,
          late: allAttendance.filter((a: AttendanceRecord) => a.status === 'LATE').length,
          absent: allAttendance.filter((a: AttendanceRecord) => a.status === 'ABSENT').length,
        });
      }

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Dashboard</h1>
        <p className="text-dark-300 mt-1">Welcome back! Here&apos;s your attendance overview.</p>
      </div>

      {/* Check In/Out Card */}
      <CheckInOut />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Days"
          value={stats.totalDays}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          title="On Time"
          value={stats.onTime}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          trend={{ value: stats.totalDays > 0 ? Math.round((stats.onTime / stats.totalDays) * 100) : 0, isPositive: true }}
        />
        <StatCard
          title="Late"
          value={stats.late}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Absent"
          value={stats.absent}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attendance */}
        <div className="bg-dark-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Attendance</h2>
            <a href="/employee/attendance" className="text-accent text-sm hover:underline">
              View All
            </a>
          </div>
          
          {recentAttendance.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              title="No attendance records"
              description="Your attendance history will appear here"
            />
          ) : (
            <div className="space-y-3">
              {recentAttendance.slice(0, 5).map((record) => (
                <AttendanceCard key={record.id} attendance={record} />
              ))}
            </div>
          )}
        </div>

        {/* Tasks */}
        <div className="bg-dark-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">My Tasks</h2>
            <a href="/employee/tasks" className="text-accent text-sm hover:underline">
              View All
            </a>
          </div>
          
          {tasks.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
              title="No tasks assigned"
              description="Tasks assigned to you will appear here"
            />
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="bg-dark-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{task.title}</h3>
                      {task.description && (
                        <p className="text-dark-300 text-sm mt-1 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={getPriorityColor(task.priority) as 'default' | 'success' | 'warning' | 'error'}>
                          {task.priority}
                        </Badge>
                        <Badge variant={getStatusColor(task.status) as 'default' | 'success' | 'warning' | 'error'}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    {task.dueDate && (
                      <span className="text-dark-400 text-sm">
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

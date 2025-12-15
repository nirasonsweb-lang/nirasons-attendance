'use client';

import { useState, useEffect } from 'react';
import { Card, Badge, Spinner } from '@/components/ui';
import { StatCard } from '@/components/dashboard/StatCard';

interface DashboardData {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  attendanceRate: number;
  weeklyTrend: { date: string; present: number; absent: number; late: number }[];
  departments: { name: string; count: number; presentToday: number }[];
  topPerformers: { name: string; department: string; onTimeRate: number }[];
  monthlyStats: { month: string; avgAttendance: number; avgLate: number }[];
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard?range=${timeRange}`);
        if (res.ok) {
          const dashData = await res.json();
          setData(dashData);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-dark-300">Failed to load analytics data</p>
      </div>
    );
  }

  const maxWeeklyValue = Math.max(
    ...data.weeklyTrend.map(d => Math.max(d.present, d.absent, d.late)),
    1
  );

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-dark-300 mt-1">Comprehensive attendance insights and trends</p>
        </div>
        <div className="flex items-center gap-2">
          {(['week', 'month', 'quarter'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-accent text-dark-900'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Employees"
          value={data.totalEmployees}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          label="Attendance Rate"
          value={`${data.attendanceRate}%`}
          sublabel="This period"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <StatCard
          label="On Time Today"
          value={data.presentToday - data.lateToday}
          sublabel={`of ${data.presentToday} present`}
          icon={
            <svg className="w-6 h-6 text-status-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Late Arrivals"
          value={data.lateToday}
          sublabel="Today"
          icon={
            <svg className="w-6 h-6 text-status-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend Chart */}
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Attendance Trend</h2>
          <div className="h-64">
            <div className="flex items-end justify-between h-48 gap-2">
              {data.weeklyTrend.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col items-center gap-1 h-40">
                    <div 
                      className="w-full bg-status-success/80 rounded-t transition-all"
                      style={{ height: `${(day.present / maxWeeklyValue) * 100}%` }}
                      title={`Present: ${day.present}`}
                    />
                    <div 
                      className="w-full bg-status-warning/80 rounded-t transition-all"
                      style={{ height: `${(day.late / maxWeeklyValue) * 100}%` }}
                      title={`Late: ${day.late}`}
                    />
                    <div 
                      className="w-full bg-status-error/80 rounded-t transition-all"
                      style={{ height: `${(day.absent / maxWeeklyValue) * 100}%` }}
                      title={`Absent: ${day.absent}`}
                    />
                  </div>
                  <span className="text-xs text-dark-400">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-status-success" />
                <span className="text-sm text-dark-300">Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-status-warning" />
                <span className="text-sm text-dark-300">Late</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-status-error" />
                <span className="text-sm text-dark-300">Absent</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Attendance Distribution */}
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Today&apos;s Distribution</h2>
          <div className="flex items-center justify-center h-48">
            <div className="relative w-48 h-48">
              {/* Simple donut chart using conic-gradient */}
              <div 
                className="w-full h-full rounded-full"
                style={{
                  background: `conic-gradient(
                    #00d4aa 0deg ${(data.presentToday - data.lateToday) / data.totalEmployees * 360}deg,
                    #f59e0b ${(data.presentToday - data.lateToday) / data.totalEmployees * 360}deg ${data.presentToday / data.totalEmployees * 360}deg,
                    #ef4444 ${data.presentToday / data.totalEmployees * 360}deg 360deg
                  )`
                }}
              >
                <div className="absolute inset-4 bg-dark-800 rounded-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">{data.attendanceRate}%</p>
                    <p className="text-sm text-dark-400">Attendance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-status-success">{data.presentToday - data.lateToday}</p>
              <p className="text-sm text-dark-400">On Time</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-status-warning">{data.lateToday}</p>
              <p className="text-sm text-dark-400">Late</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-status-error">{data.absentToday}</p>
              <p className="text-sm text-dark-400">Absent</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Department Stats & Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Department Overview</h2>
          <div className="space-y-4">
            {data.departments.map((dept, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-dark-300">{dept.name || 'Unassigned'}</span>
                  <span className="text-white font-medium">{dept.presentToday}/{dept.count}</span>
                </div>
                <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${(dept.presentToday / dept.count) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {data.departments.length === 0 && (
              <p className="text-center text-dark-400 py-4">No department data available</p>
            )}
          </div>
        </Card>

        {/* Top Performers */}
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Top Performers</h2>
          <div className="space-y-3">
            {data.topPerformers.map((performer, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                    i === 1 ? 'bg-gray-400/20 text-gray-400' :
                    i === 2 ? 'bg-orange-500/20 text-orange-500' :
                    'bg-dark-600 text-dark-300'
                  }`}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-medium text-white">{performer.name}</p>
                    <p className="text-sm text-dark-400">{performer.department || 'No Department'}</p>
                  </div>
                </div>
                <Badge variant="success">{performer.onTimeRate}% on time</Badge>
              </div>
            ))}
            {data.topPerformers.length === 0 && (
              <p className="text-center text-dark-400 py-4">No performance data available</p>
            )}
          </div>
        </Card>
      </div>

      {/* Monthly Comparison */}
      <Card>
        <h2 className="text-lg font-semibold text-white mb-4">Monthly Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-500">
                <th className="table-header pb-3 text-left">Month</th>
                <th className="table-header pb-3 text-left">Avg Attendance</th>
                <th className="table-header pb-3 text-left">Avg Late %</th>
                <th className="table-header pb-3 text-left">Trend</th>
              </tr>
            </thead>
            <tbody>
              {data.monthlyStats.map((month, i) => (
                <tr key={i} className="border-b border-dark-600 last:border-0">
                  <td className="table-cell py-4 text-white">{month.month}</td>
                  <td className="table-cell py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-dark-600 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent rounded-full"
                          style={{ width: `${month.avgAttendance}%` }}
                        />
                      </div>
                      <span className="text-white">{month.avgAttendance}%</span>
                    </div>
                  </td>
                  <td className="table-cell py-4 text-dark-300">{month.avgLate}%</td>
                  <td className="table-cell py-4">
                    {i > 0 && (
                      <span className={`flex items-center gap-1 ${
                        month.avgAttendance >= data.monthlyStats[i-1].avgAttendance 
                          ? 'text-status-success' 
                          : 'text-status-error'
                      }`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d={month.avgAttendance >= data.monthlyStats[i-1].avgAttendance 
                              ? "M5 15l7-7 7 7" 
                              : "M19 9l-7 7-7-7"} 
                          />
                        </svg>
                        {Math.abs(month.avgAttendance - data.monthlyStats[i-1].avgAttendance).toFixed(1)}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {data.monthlyStats.length === 0 && (
                <tr>
                  <td colSpan={4} className="table-cell text-center text-dark-400 py-8">
                    No monthly data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

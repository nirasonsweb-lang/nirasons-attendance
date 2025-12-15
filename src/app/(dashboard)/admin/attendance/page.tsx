'use client';

import { useState, useEffect } from 'react';
import { Card, Badge, Button, Input, Spinner, EmptyState } from '@/components/ui';
import { formatDate, formatTime } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  department: string | null;
  position: string | null;
}

interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: 'ON_TIME' | 'LATE' | 'ABSENT' | 'HALF_DAY';
  workHours: number | null;
  checkInAddress: string | null;
  checkOutAddress: string | null;
  notes: string | null;
  user: User;
}

export default function AdminAttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [departments, setDepartments] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (dateFilter) params.append('date', dateFilter);
      if (departmentFilter !== 'all') params.append('department', departmentFilter);

      const res = await fetch(`/api/attendance?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAttendance(data.attendance || []);
        setTotalPages(data.pagination?.totalPages || 1);

        // Extract unique departments
        const depts = new Set<string>();
        data.attendance?.forEach((a: AttendanceRecord) => {
          if (a.user.department) depts.add(a.user.department);
        });
        setDepartments(Array.from(depts));
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [page, statusFilter, dateFilter, departmentFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      setPage(1);
      fetchAttendance();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ON_TIME':
        return <Badge variant="success">On Time</Badge>;
      case 'LATE':
        return <Badge variant="warning">Late</Badge>;
      case 'ABSENT':
        return <Badge variant="error">Absent</Badge>;
      case 'HALF_DAY':
        return <Badge variant="default">Half Day</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const exportToCSV = () => {
    // Helper function to escape CSV fields
    const escapeCSV = (value: string | null | undefined): string => {
      if (!value) return '-';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = ['Date', 'Employee', 'Department', 'Check In', 'Check Out', 'Status', 'Work Hours'];
    const rows = attendance.map(a => [
      formatDate(a.date),
      escapeCSV(a.user.name),
      escapeCSV(a.user.department),
      formatTime(a.checkInTime),
      formatTime(a.checkOutTime),
      a.status,
      a.workHours ? `${a.workHours.toFixed(2)}h` : '-',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Attendance Reports</h1>
          <p className="text-dark-300 mt-1">View and manage all attendance records</p>
        </div>
        <Button onClick={exportToCSV} variant="secondary">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <Input
              placeholder="Search by employee name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
          <div>
            <select
              className="input w-full"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Status</option>
              <option value="ON_TIME">On Time</option>
              <option value="LATE">Late</option>
              <option value="ABSENT">Absent</option>
              <option value="HALF_DAY">Half Day</option>
            </select>
          </div>
          <div>
            <select
              className="input w-full"
              value={departmentFilter}
              onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div>
            <input
              type="date"
              className="input w-full"
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-dark-600">
          <p className="text-dark-300 text-sm">
            Showing {attendance.length} records
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded ${viewMode === 'table' ? 'bg-accent text-dark-900' : 'bg-dark-600 text-dark-300'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded ${viewMode === 'cards' ? 'bg-accent text-dark-900' : 'bg-dark-600 text-dark-300'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>
        </div>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      ) : attendance.length === 0 ? (
        <Card>
          <EmptyState
            icon={
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            title="No attendance records found"
            description="Try adjusting your filters or search terms"
          />
        </Card>
      ) : viewMode === 'table' ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-500">
                  <th className="table-header pb-3 text-left">Date</th>
                  <th className="table-header pb-3 text-left">Employee</th>
                  <th className="table-header pb-3 text-left">Department</th>
                  <th className="table-header pb-3 text-left">Check In</th>
                  <th className="table-header pb-3 text-left">Check Out</th>
                  <th className="table-header pb-3 text-left">Work Hours</th>
                  <th className="table-header pb-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record) => (
                  <tr key={record.id} className="border-b border-dark-600 last:border-0 hover:bg-dark-700/50">
                    <td className="table-cell py-4">
                      <span className="text-white">{formatDate(record.date)}</span>
                    </td>
                    <td className="table-cell py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-medium">
                          {record.user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-white">{record.user.name}</p>
                          <p className="text-xs text-dark-400">{record.user.position || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell py-4 text-dark-300">
                      {record.user.department || '-'}
                    </td>
                    <td className="table-cell py-4 font-mono text-white">
                      {formatTime(record.checkInTime)}
                    </td>
                    <td className="table-cell py-4 font-mono text-white">
                      {formatTime(record.checkOutTime)}
                    </td>
                    <td className="table-cell py-4 text-dark-300">
                      {record.workHours ? `${record.workHours.toFixed(2)}h` : '-'}
                    </td>
                    <td className="table-cell py-4">
                      {getStatusBadge(record.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {attendance.map((record) => (
            <Card key={record.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-medium">
                    {record.user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium text-white">{record.user.name}</p>
                    <p className="text-sm text-dark-400">{record.user.department || 'No Department'}</p>
                  </div>
                </div>
                {getStatusBadge(record.status)}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-400">Date</span>
                  <span className="text-white">{formatDate(record.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Check In</span>
                  <span className="text-white font-mono">{formatTime(record.checkInTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Check Out</span>
                  <span className="text-white font-mono">{formatTime(record.checkOutTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Work Hours</span>
                  <span className="text-white">{record.workHours ? `${record.workHours.toFixed(2)}h` : '-'}</span>
                </div>
              </div>
              {record.checkInAddress && (
                <div className="mt-3 pt-3 border-t border-dark-600">
                  <p className="text-xs text-dark-400">
                    <svg className="w-3 h-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {record.checkInAddress}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5) {
                if (page <= 3) pageNum = i + 1;
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded text-sm ${page === pageNum
                      ? 'bg-accent text-dark-900 font-medium'
                      : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

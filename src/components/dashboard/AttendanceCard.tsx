'use client';

import { formatDate, formatTime } from '@/lib/utils';
import { Badge } from '@/components/ui';

interface AttendanceCardProps {
  attendance: {
    id: string;
    userId?: string;
    date: Date | string;
    checkInTime?: Date | string | null;
    checkOutTime?: Date | string | null;
    status: 'ON_TIME' | 'LATE' | 'ABSENT' | 'HALF_DAY';
    workHours?: number | null;
  };
}

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  ON_TIME: 'success',
  LATE: 'warning',
  ABSENT: 'default',
  HALF_DAY: 'warning',
};

const statusLabel: Record<string, string> = {
  ON_TIME: 'On Time',
  LATE: 'Late',
  ABSENT: 'Absent',
  HALF_DAY: 'Half Day',
};

export function AttendanceCard({ attendance }: AttendanceCardProps) {
  return (
    <div className="bg-dark-600 rounded-xl p-4 border border-dark-500/50 hover:border-dark-400 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium text-white">{formatDate(attendance.date)}</span>
        </div>
        <Badge variant={statusVariant[attendance.status]}>
          {statusLabel[attendance.status]}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Check In Time</p>
          <p className="text-lg font-semibold text-white">
            {formatTime(attendance.checkInTime)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Check Out Time</p>
          <p className="text-lg font-semibold text-white">
            {formatTime(attendance.checkOutTime)}
          </p>
        </div>
      </div>

      {attendance.workHours && (
        <div className="mt-3 pt-3 border-t border-dark-500/50">
          <p className="text-xs text-gray-500">
            Work Hours: <span className="text-accent-primary font-medium">{attendance.workHours.toFixed(2)} hrs</span>
          </p>
        </div>
      )}
    </div>
  );
}

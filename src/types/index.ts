export type Role = 'ADMIN' | 'EMPLOYEE';

export type AttendanceStatus = 'ON_TIME' | 'LATE' | 'ABSENT' | 'HALF_DAY';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string | null;
  department?: string | null;
  position?: string | null;
  avatar?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attendance {
  id: string;
  userId: string;
  date: Date;
  checkInTime?: Date | null;
  checkOutTime?: Date | null;
  checkInLat?: number | null;
  checkInLng?: number | null;
  checkOutLat?: number | null;
  checkOutLng?: number | null;
  checkInAddr?: string | null;
  checkOutAddr?: string | null;
  status: AttendanceStatus;
  workHours?: number | null;
  notes?: string | null;
  user?: User;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  assignedTo: string;
  dueDate?: Date | null;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  user?: User;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  description?: string | null;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  exp: number;
  iat: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  avgCheckInTime: string;
  avgCheckOutTime: string;
}

export interface AttendanceWithUser extends Attendance {
  user: User;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

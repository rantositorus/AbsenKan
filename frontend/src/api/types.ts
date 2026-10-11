export type UserRole = 'employee' | 'hr_admin';

export interface User {
  id: number;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string | null;
  department: string | null;
  position: string | null;
  joinDate: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AttendanceType = 'check_in' | 'check_out';
export type AttendanceStatus = 'on_time' | 'late';

export interface AttendanceRecord {
  id: number;
  type: AttendanceType;
  attendanceDate: string;
  capturedAt: string;
  capturedAtWib: string;
  status: AttendanceStatus | null;
  note: string | null;
  photoUrl: string;
}

export interface TodayStatus {
  date: string;
  checkIn: AttendanceRecord | null;
  checkOut: AttendanceRecord | null;
  status: AttendanceStatus | null;
}

export interface MonitoringRow {
  id: number;
  attendanceDate: string;
  employeeId: number;
  employeeCode: string;
  fullName: string;
  department: string | null;
  position: string | null;
  checkIn: AttendanceRecord | null;
  checkOut: AttendanceRecord | null;
  status: AttendanceStatus | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardSummary {
  date: string;
  activeEmployees: number;
  checkedIn: number;
  late: number;
  notYetCheckedIn: number;
  notYetList: Array<{
    id: number;
    employeeCode: string;
    fullName: string;
    department: string | null;
  }>;
}

export interface AuditLog {
  id: number;
  actorId: number | null;
  actorIdentifier: string | null;
  action: string;
  targetTable: string;
  targetId: string | null;
  changes: Record<string, unknown> | null;
  createdAt: string;
}

export interface RecapRow {
  employeeId: number;
  employeeCode: string;
  fullName: string;
  department: string | null;
  position: string | null;
  presentDays: number;
  lateDays: number;
  absentDays: number;
}

export interface RecapSummary {
  month: string;
  workingDays: number;
  items: RecapRow[];
}

export interface NotificationItem {
  id: number;
  audience: 'hr_admin' | 'employee' | 'all';
  employeeId: number | null;
  type: string;
  attendanceDate: string | null;
  message: string;
  read: boolean;
  createdAt: string;
}
import type {
  AttendanceRecord,
  AuditLog,
  DashboardSummary,
  MonitoringRow,
  NotificationItem,
  Paginated,
  RecapSummary,
  TodayStatus,
  User,
} from './types';

const BASE = '/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isForm = options.body instanceof FormData;
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: isForm
      ? undefined
      : { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  if (res.status === 401) {
    // Token cookie tidak valid / kedaluwarsa.
    window.dispatchEvent(new Event('absenkan:unauthorized'));
  }

  if (!res.ok) {
    let message = `Terjadi kesalahan (${res.status})`;
    try {
      const data = await res.json();
      if (Array.isArray(data.message)) message = data.message.join(', ');
      else if (typeof data.message === 'string') message = data.message;
    } catch {
      /* respons bukan JSON */
    }
    throw new ApiError(res.status, message);
  }

  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json() as Promise<T>;
  return res.text() as unknown as Promise<T>;
}

function qs(params: Record<string, string | number | undefined>): string {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') s.set(k, String(v));
  }
  const str = s.toString();
  return str ? `?${str}` : '';
}

function submitAttendance(type: 'check-in' | 'check-out', photo: Blob, note?: string) {
  const fd = new FormData();
  fd.append('photo', photo, 'absen.jpg');
  const q = note && note.trim() ? `?note=${encodeURIComponent(note.trim())}` : '';
  return request<AttendanceRecord>(`/attendance/${type}${q}`, { method: 'POST', body: fd });
}

export const api = {
  // ---- Auth ----
  login: (identifier: string, password: string) =>
    request<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }),
  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
  me: () => request<User>('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // ---- Absensi (karyawan) ----
  today: () => request<TodayStatus>('/attendance/today'),
  history: (month?: string) =>
    request<AttendanceRecord[]>(`/attendance/history${month ? `?month=${month}` : ''}`),
  checkIn: (photo: Blob, note?: string) => submitAttendance('check-in', photo, note),
  checkOut: (photo: Blob, note?: string) => submitAttendance('check-out', photo, note),

  // ---- Absensi (admin) ----
  monitoring: (params: Record<string, string | number | undefined>) =>
    request<Paginated<MonitoringRow>>(`/attendance/monitoring${qs(params)}`),
  dashboard: () => request<DashboardSummary>('/attendance/dashboard'),
  exportUrl: (params: Record<string, string>) => `${BASE}/attendance/export${qs(params)}`,
  exportExcelUrl: (params: Record<string, string>) => `${BASE}/attendance/export-excel${qs(params)}`,
  recap: (month?: string) =>
    request<RecapSummary>(`/attendance/recap${month ? `?month=${month}` : ''}`),

  // ---- Karyawan (admin) ----
  employees: (params: Record<string, string | number | undefined>) =>
    request<Paginated<User>>(`/employees${qs(params)}`),
  departments: () => request<string[]>('/employees/departments'),
  createEmployee: (data: Record<string, unknown>) =>
    request<User>('/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id: number, data: Record<string, unknown>) =>
    request<User>(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  setActive: (id: number, isActive: boolean) =>
    request<User>(`/employees/${id}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),
  resetPassword: (id: number, newPassword: string) =>
    request<{ message: string }>(`/employees/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    }),

  // ---- Audit log (admin) ----
  auditLogs: (params: Record<string, string | number | undefined>) =>
    request<Paginated<AuditLog>>(`/audit-logs${qs(params)}`),

  // ---- Notifikasi (admin) ----
  notifications: (params: Record<string, string | number | undefined> = {}) =>
    request<Paginated<NotificationItem>>(`/notifications${qs(params)}`),
  markNotificationRead: (id: number) =>
    request<NotificationItem>(`/notifications/${id}/read`, { method: 'PATCH', body: '{}' }),
  markNotificationsReadAll: () =>
    request<{ message: string }>('/notifications/read-all', { method: 'PATCH', body: '{}' }),

  // ---- Pengaturan ----
  settings: () => request<Record<string, string>>('/settings'),
  updateSetting: (key: string, value: string) =>
    request<Record<string, string>>(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    }),
};

export const photoUrl = (filename: string) => `${BASE}/uploads/photos/${filename}`;
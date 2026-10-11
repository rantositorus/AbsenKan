import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api, ApiError, photoUrl } from '../../api/client';
import { useI18n } from '../../i18n';
import type { AttendanceRecord } from '../../api/types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '../../components/ui';

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function EmployeeHistoryPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<AttendanceRecord[]>([]);
  const [month, setMonth] = useState(currentMonth());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await api.history(month));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('hist.loadError'));
    } finally {
      setLoading(false);
    }
  }, [month, t]);

  useEffect(() => {
    load();
  }, [load]);

  const byDate = new Map<string, AttendanceRecord[]>();
  for (const r of rows) {
    if (!byDate.has(r.attendanceDate)) byDate.set(r.attendanceDate, []);
    byDate.get(r.attendanceDate)!.push(r);
  }
  const dates = Array.from(byDate.keys());

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{t('hist.title')}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{t('hist.subtitle')}</p>
        </div>
        <Input
          type="month"
          className="w-auto"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </div>

      {loading ? (
        <Spinner />
      ) : dates.length === 0 ? (
        <Card>
          <CardContent className="text-center text-sm text-muted-foreground">
            {t('hist.empty')}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {dates.map((date) => {
            const dayRows = byDate.get(date)!;
            const checkIn = dayRows.find((r) => r.type === 'check_in');
            const checkOut = dayRows.find((r) => r.type === 'check_out');
            return (
              <Card key={date}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{date}</div>
                    {checkIn &&
                      (checkIn.status === 'late' ? (
                        <Badge variant="destructive">{t('status.late')}</Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-700">{t('status.present')}</Badge>
                      ))}
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-3">
                      {checkIn && (
                        <img
                          src={photoUrl(checkIn.photoUrl)}
                          alt={t('emp.in')}
                          className="h-14 w-14 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <div className="text-xs text-muted-foreground">{t('hist.in')}</div>
                        <div className="font-medium">{checkIn ? checkIn.capturedAtWib : '—'}</div>
                        {checkIn?.note && <div className="text-xs text-muted-foreground">{checkIn.note}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {checkOut && (
                        <img
                          src={photoUrl(checkOut.photoUrl)}
                          alt={t('emp.out')}
                          className="h-14 w-14 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <div className="text-xs text-muted-foreground">{t('hist.out')}</div>
                        <div className="font-medium">{checkOut ? checkOut.capturedAtWib : '—'}</div>
                        {checkOut?.note && <div className="text-xs text-muted-foreground">{checkOut.note}</div>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

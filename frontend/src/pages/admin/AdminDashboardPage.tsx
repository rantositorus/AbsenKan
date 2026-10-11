import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api, ApiError } from '../../api/client';
import { useI18n } from '../../i18n';
import type { DashboardSummary } from '../../api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '../../components/ui';

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className={`text-3xl font-bold ${color}`}>{value}</div>
        <div className="mt-1 text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

export function AdminDashboardPage() {
  const { t } = useI18n();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.dashboard());
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('adm.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Spinner label={t('common.loadingDashboard')} />;

  return (
    <div>
      <h1 className="text-xl font-bold">{t('adm.title')}</h1>
      <p className="mt-0.5 mb-5 text-sm text-muted-foreground">
        {t('adm.summaryFor', { date: data?.date ?? '' })}
      </p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label={t('adm.activeEmployees')} value={data?.activeEmployees ?? 0} color="text-foreground" />
        <Stat label={t('adm.checkedIn')} value={data?.checkedIn ?? 0} color="text-emerald-600" />
        <Stat label={t('adm.late')} value={data?.late ?? 0} color="text-red-600" />
        <Stat label={t('adm.notYet')} value={data?.notYetCheckedIn ?? 0} color="text-amber-600" />
      </div>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">{t('adm.notYetToday')}</CardTitle>
        </CardHeader>
        <CardContent>
          {data && data.notYetList.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('adm.allCheckedIn')}</p>
          ) : (
            <div className="divide-y">
              {data?.notYetList.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="font-medium">{e.fullName}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.employeeCode} · {e.department || '-'}
                    </div>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                    {t('status.notYet')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

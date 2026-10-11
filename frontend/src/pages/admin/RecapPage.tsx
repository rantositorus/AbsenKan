import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api, ApiError } from '../../api/client';
import { useI18n } from '../../i18n';
import type { RecapSummary } from '../../api/types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { PageHeader, Spinner } from '../../components/ui';

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function RecapPage() {
  const { t } = useI18n();
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<RecapSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.recap(month));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('recap.loadError'));
    } finally {
      setLoading(false);
    }
  }, [month, t]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title={t('recap.title')}
        subtitle={t('recap.subtitle')}
        action={
          <Input
            type="month"
            className="w-auto"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        }
      />

      {loading ? (
        <Spinner label={t('common.loadingRecap')} />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('th.id')}</TableHead>
                <TableHead>{t('th.nama')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('th.departemen')}</TableHead>
                <TableHead className="hidden lg:table-cell">{t('th.jabatan')}</TableHead>
                <TableHead className="text-center">{t('th.hadir')}</TableHead>
                <TableHead className="text-center">{t('th.terlambat')}</TableHead>
                <TableHead className="text-center">{t('th.tidakHadir')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((r) => (
                <TableRow key={r.employeeId}>
                  <TableCell className="font-mono">{r.employeeCode}</TableCell>
                  <TableCell className="font-medium">{r.fullName}</TableCell>
                  <TableCell className="hidden md:table-cell">{r.department || '-'}</TableCell>
                  <TableCell className="hidden lg:table-cell">{r.position || '-'}</TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-emerald-100 text-emerald-700">{r.presentDays}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {r.lateDays > 0 ? (
                      <Badge variant="destructive">{r.lateDays}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {r.absentDays > 0 ? (
                      <Badge className="bg-amber-100 text-amber-700">{r.absentDays}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {data && data.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    {t('empPage.noActive')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {data && (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              {t('recap.workingDays', { month: data.month })} <span className="font-semibold">{data.workingDays}</span>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

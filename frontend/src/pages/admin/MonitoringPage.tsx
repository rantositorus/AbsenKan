import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Download, Eye } from 'lucide-react';
import { api, ApiError, photoUrl } from '../../api/client';
import { useI18n } from '../../i18n';
import type { MonitoringRow } from '../../api/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Modal, PageHeader, Pagination, Spinner } from '../../components/ui';

export function MonitoringPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<MonitoringRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<MonitoringRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.monitoring({ page, limit, from, to, search, status });
      setRows(res.items);
      setTotal(res.total);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('mon.loadError'));
    } finally {
      setLoading(false);
    }
  }, [page, limit, from, to, search, status, t]);

  useEffect(() => {
    load();
  }, [load]);

  function exportCsv() {
    window.open(api.exportUrl({ from, to, search, status }), '_blank');
  }

  function exportExcel() {
    window.open(api.exportExcelUrl({ from, to, search, status }), '_blank');
  }

  return (
    <div>
      <PageHeader
        title={t('mon.title')}
        subtitle={t('mon.subtitle')}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportExcel}>
              <Download className="size-4" />
              Excel
            </Button>
            <Button variant="outline" onClick={exportCsv}>
              <Download className="size-4" />
              CSV
            </Button>
          </div>
        }
      />

      {/* Filter */}
      <Card className="mb-4">
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
          <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
          <Input placeholder={t('mon.search')} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v ?? '');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('mon.allStatus')}>
                {(v) =>
                  v === 'on_time'
                    ? t('status.present')
                    : v === 'late'
                      ? t('status.late')
                      : t('mon.allStatus')
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('mon.allStatus')}</SelectItem>
              <SelectItem value="on_time">{t('status.present')}</SelectItem>
              <SelectItem value="late">{t('status.late')}</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-sm text-muted-foreground lg:text-right">{t('common.data', { n: total })}</div>
        </CardContent>
      </Card>

      {loading ? (
        <Spinner />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('th.tanggal')}</TableHead>
                <TableHead>{t('th.id')}</TableHead>
                <TableHead>{t('th.nama')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('th.departemen')}</TableHead>
                <TableHead>{t('th.masuk')}</TableHead>
                <TableHead>{t('th.pulang')}</TableHead>
                <TableHead>{t('th.status')}</TableHead>
                <TableHead className="text-right">{t('th.detail')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={`${r.employeeId}-${r.attendanceDate}`}>
                  <TableCell>{r.attendanceDate}</TableCell>
                  <TableCell className="font-mono">{r.employeeCode}</TableCell>
                  <TableCell className="font-medium">{r.fullName}</TableCell>
                  <TableCell className="hidden md:table-cell">{r.department || '-'}</TableCell>
                  <TableCell>{r.checkIn ? r.checkIn.capturedAtWib : '—'}</TableCell>
                  <TableCell>{r.checkOut ? r.checkOut.capturedAtWib : '—'}</TableCell>
                  <TableCell>
                    {r.status === 'late' ? (
                      <Badge variant="destructive">{t('status.late')}</Badge>
                    ) : r.status ? (
                      <Badge className="bg-emerald-100 text-emerald-700">{t('status.present')}</Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700">{t('status.notYet')}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setDetail(r)}>
                      <Eye className="size-3.5" />
                      {t('mon.detail')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    {t('common.noData')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="px-4 py-3">
            <Pagination page={page} total={total} limit={limit} onChange={setPage} />
          </div>
        </Card>
      )}

      {/* Detail foto */}
      {detail && (
        <Modal title={t('mon.detailTitle', { name: detail.fullName })} onClose={() => setDetail(null)}>
          <div className="text-sm text-muted-foreground">
            {detail.attendanceDate} · {detail.employeeCode}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">{t('mon.inLabel')}</div>
              {detail.checkIn ? (
                <>
                  <img src={photoUrl(detail.checkIn.photoUrl)} alt={t('emp.in')} className="w-full rounded-lg object-cover" />
                  <div className="mt-1 text-sm">
                    {detail.checkIn.capturedAtWib}
                    {detail.checkIn.note && (
                      <span className="text-xs text-muted-foreground"> · {detail.checkIn.note}</span>
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                  {t('mon.notAbsent')}
                </div>
              )}
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">{t('mon.outLabel')}</div>
              {detail.checkOut ? (
                <>
                  <img src={photoUrl(detail.checkOut.photoUrl)} alt={t('emp.out')} className="w-full rounded-lg object-cover" />
                  <div className="mt-1 text-sm">
                    {detail.checkOut.capturedAtWib}
                    {detail.checkOut.note && (
                      <span className="text-xs text-muted-foreground"> · {detail.checkOut.note}</span>
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                  {t('mon.notAbsent')}
                </div>
              )}
            </div>
          </div>
          <p className="mt-4 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            {t('mon.immutableNote')}
          </p>
        </Modal>
      )}
    </div>
  );
}

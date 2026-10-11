import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api, ApiError } from '../../api/client';
import { useI18n } from '../../i18n';
import type { AuditLog } from '../../api/types';
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
import { PageHeader, Pagination, Spinner } from '../../components/ui';

const ACTION_KEYS = ['CREATE', 'UPDATE', 'ACTIVATE', 'DEACTIVATE', 'RESET_PASSWORD'];

export function AuditLogPage() {
  const { t, locale } = useI18n();
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.auditLogs({ page, limit, action });
      setRows(res.items);
      setTotal(res.total);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('audit.loadError'));
    } finally {
      setLoading(false);
    }
  }, [page, limit, action, t]);

  useEffect(() => {
    load();
  }, [load]);

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
  }

  return (
    <div>
      <PageHeader title={t('audit.title')} subtitle={t('audit.subtitle')} />

      <Card className="mb-4">
        <CardContent>
          <Select
            value={action}
            onValueChange={(v) => {
              setAction(v ?? '');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-auto">
              <SelectValue placeholder={t('audit.allAction')}>
                {(v) => {
                  if (!v) return t('audit.allAction');
                  const label = t(`audit.action.${v}`);
                  return label === `audit.action.${v}` ? v : label;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('audit.allAction')}</SelectItem>
              {ACTION_KEYS.map((k) => (
                <SelectItem key={k} value={k}>
                  {t(`audit.action.${k}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <Spinner />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('th.waktu')}</TableHead>
                <TableHead>{t('th.aktor')}</TableHead>
                <TableHead>{t('th.aksi')}</TableHead>
                <TableHead>{t('th.target')}</TableHead>
                <TableHead className="hidden lg:table-cell">{t('th.perubahan')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                // t() mengembalikan key itu sendiri bila key tak ada di katalog,
                // jadi kode aksi yang belum dikenal ditampilkan apa adanya.
                const label = t(`audit.action.${r.action}`);
                const display = label === `audit.action.${r.action}` ? r.action : label;
                return (
                  <TableRow key={r.id} className="align-top">
                    <TableCell className="whitespace-nowrap">{fmtTime(r.createdAt)}</TableCell>
                    <TableCell>{r.actorIdentifier || '—'}</TableCell>
                    <TableCell>
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                        {display}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">{r.targetTable}</span>
                      {r.targetId && <span className="text-muted-foreground"> #{r.targetId}</span>}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {r.changes ? (
                        <pre className="max-h-24 overflow-auto rounded bg-muted/50 p-2 text-xs">
                          {JSON.stringify(r.changes, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
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
    </div>
  );
}

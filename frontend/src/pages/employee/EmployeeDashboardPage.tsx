import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { LogIn, LogOut } from 'lucide-react';
import { api, ApiError } from '../../api/client';
import { useI18n } from '../../i18n';
import type { TodayStatus } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal, Spinner } from '../../components/ui';
import { CameraCapture } from '../../components/CameraCapture';

type ActionType = 'check-in' | 'check-out';

export function EmployeeDashboardPage() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [today, setToday] = useState<TodayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ActionType | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [clock, setClock] = useState(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setToday(await api.today());
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('emp.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
    const t2 = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t2);
  }, [load]);

  const canCheckOut = today && !!today.checkIn && !today.checkOut;

  async function handleCapture(blob: Blob) {
    if (!modal) return;
    setSubmitting(true);
    try {
      await (modal === 'check-in' ? api.checkIn(blob, note) : api.checkOut(blob, note));
      toast.success(modal === 'check-in' ? t('emp.checkinDone') : t('emp.checkoutDone'));
      setModal(null);
      setNote('');
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('emp.sendFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  const clockText = clock.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const dateText = clock.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (loading) return <Spinner label={t('common.loadingAttendance')} />;

  return (
    <div>
      {/* Kartu identitas + jam */}
      <Card className="mb-5">
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">{user?.fullName}</div>
            <div className="text-sm text-muted-foreground">
              {user?.employeeCode} · {user?.department || '-'} · {user?.position || '-'}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-2xl font-bold text-primary">{clockText}</div>
            <div className="text-sm text-muted-foreground">{dateText}</div>
          </div>
        </CardContent>
      </Card>

      {/* Status hari ini */}
      <Card className="mb-5">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">{t('emp.statusCardTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="text-xs text-muted-foreground">{t('emp.in')}</div>
              <div className="mt-1 text-lg font-semibold">
                {today?.checkIn ? today.checkIn.capturedAtWib : t('status.notYet')}
              </div>
              {today?.checkIn && (
                <div className="mt-1">
                  {today.status === 'late' ? (
                    <Badge variant="destructive">{t('status.late')}</Badge>
                  ) : (
                    <Badge className="bg-emerald-100 text-emerald-700">{t('status.present')}</Badge>
                  )}
                </div>
              )}
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="text-xs text-muted-foreground">{t('emp.out')}</div>
              <div className="mt-1 text-lg font-semibold">
                {today?.checkOut ? today.checkOut.capturedAtWib : t('status.notYet')}
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="text-xs text-muted-foreground">{t('emp.date')}</div>
              <div className="mt-1 text-lg font-semibold">{today?.date}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tombol aksi */}
      {!today?.checkIn && (
        <Button className="w-full py-3 text-base" onClick={() => setModal('check-in')}>
          <LogIn className="size-4" />
          {t('emp.checkIn')}
        </Button>
      )}
      {canCheckOut && (
        <Button variant="outline" className="w-full py-3 text-base" onClick={() => setModal('check-out')}>
          <LogOut className="size-4" />
          {t('emp.checkOut')}
        </Button>
      )}
      {today?.checkIn && today?.checkOut && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm text-emerald-700">
          {t('emp.complete')}
        </div>
      )}

      {/* Modal kamera */}
      {modal && (
        <Modal
          title={modal === 'check-in' ? t('emp.checkIn') : t('emp.checkOut')}
          onClose={() => !submitting && setModal(null)}
        >
          <p className="text-sm text-muted-foreground">{t('emp.photoPrompt')}</p>
          <div className="grid gap-1.5">
            <Label htmlFor="note">{t('emp.noteLabel')}</Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('emp.notePlaceholder')}
            />
          </div>
          <CameraCapture
            onCapture={handleCapture}
            onCancel={() => !submitting && setModal(null)}
            submitting={submitting}
          />
        </Modal>
      )}
    </div>
  );
}

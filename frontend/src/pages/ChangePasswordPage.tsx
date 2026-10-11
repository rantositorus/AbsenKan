import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { api, ApiError } from '../api/client';
import { useI18n } from '../i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '../components/ui';

export function ChangePasswordPage() {
  const { t } = useI18n();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error(t('pw.tooShort'));
      return;
    }
    if (newPassword !== confirm) {
      toast.error(t('pw.mismatch'));
      return;
    }
    setBusy(true);
    try {
      const res = await api.changePassword(currentPassword, newPassword);
      toast.success(res.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('pw.saveFailed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title={t('pw.title')} subtitle={t('pw.subtitle')} />
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>{t('pw.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="current">{t('pw.current')}</Label>
              <Input
                id="current"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="new">{t('pw.new')}</Label>
              <Input
                id="new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <span className="text-xs text-muted-foreground">{t('common.minChars')}</span>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="confirm">{t('pw.confirm')}</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <Button type="submit" disabled={busy} className="w-fit">
              {busy ? t('common.saving') : t('common.savePassword')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

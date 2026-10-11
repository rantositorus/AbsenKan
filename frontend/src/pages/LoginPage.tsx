import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';
import { ApiError } from '../api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageToggle } from '@/components/LanguageToggle';

export function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await login(identifier, password);
      const dest =
        from ||
        (res.role === 'hr_admin' ? '/admin' : from && !from.startsWith('/admin') ? from : '/');
      navigate(dest, { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('login.failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground">
            A
          </span>
          <h1 className="mt-3 text-2xl font-bold">{t('app.name')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('login.subtitle')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('login.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="identifier">{t('login.idLabel')}</Label>
                <Input
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={t('login.idPlaceholder')}
                  autoComplete="username"
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="password">{t('login.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? t('common.processing') : t('login.submit')}
              </Button>
            </form>
            <div className="mt-4 flex justify-center">
              <LanguageToggle />
            </div>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">{t('login.hintAdmin')}</p>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { api, ApiError } from '../../api/client';
import { useI18n } from '../../i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader, Spinner } from '../../components/ui';

const SETTING_KEYS = ['check_in_time', 'check_out_time', 'lateness_grace_min', 'max_photo_size_mb'] as const;

export function SettingsPage() {
  const { t } = useI18n();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSettings(await api.settings());
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('settings.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(key: string, value: string) {
    try {
      await api.updateSetting(key, value);
      toast.success(t('settings.saved', { name: t(`settings.${key}`) || key }));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('settings.saveError'));
    }
  }

  if (loading) return <Spinner label={t('common.loadingSettings')} />;

  return (
    <div>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {SETTING_KEYS.map((key) => (
          <SettingCard
            key={key}
            label={t(`settings.${key}`)}
            hint={t(`settings.${key}.hint`)}
            value={settings[key] ?? ''}
            onSave={(v) => save(key, v)}
          />
        ))}
      </div>
    </div>
  );
}

function SettingCard({
  label,
  hint,
  value,
  onSave,
}: {
  label: string;
  hint: string;
  value: string;
  onSave: (v: string) => void;
}) {
  const { t } = useI18n();
  const [val, setVal] = useState(value);
  const [busy, setBusy] = useState(false);

  useEffect(() => setVal(value), [value]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!val.trim()) return;
    setBusy(true);
    try {
      await onSave(val.trim());
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-1.5">
          <Label>{label}</Label>
          <div className="flex gap-2">
            <Input value={val} onChange={(e) => setVal(e.target.value)} />
            <Button type="submit" disabled={busy || !val.trim()}>
              {busy ? '…' : t('common.save')}
            </Button>
          </div>
          <span className="text-xs text-muted-foreground">{hint}</span>
        </form>
      </CardContent>
    </Card>
  );
}

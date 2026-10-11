import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '../api/client';
import { useI18n } from '../i18n';
import type { NotificationItem } from '../api/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/** Lonceng notifikasi untuk Admin HRD. */
export function NotificationsBell() {
  const { t, locale } = useI18n();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const opened = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await api.notifications({ limit: 10 });
      setItems(res.items);
      setUnread(res.items.filter((n) => !n.read).length);
    } catch (err) {
      // jangan ganggu UI bila gagal; cukup lewati
      void err;
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function openChanged(open: boolean) {
    if (open) {
      opened.current = true;
      await load();
    }
  }

  async function markRead(n: NotificationItem) {
    try {
      await api.markNotificationRead(n.id);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('notif.failed'));
    }
  }

  async function markAll() {
    try {
      await api.markNotificationsReadAll();
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('notif.failed'));
    }
  }

  return (
    <DropdownMenu onOpenChange={openChanged}>
      <DropdownMenuTrigger render={<Button variant="outline" size="icon" className="relative" />}>
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>{t('notif.title')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="px-3 py-4 text-center text-sm text-muted-foreground">
            {t('notif.empty')}
          </div>
        ) : (
          items.map((n) => (
            <DropdownMenuItem
              key={n.id}
              disabled={n.read}
              onClick={() => !n.read && markRead(n)}
              className="flex-col items-start gap-0.5 py-2"
            >
              <span className="text-sm">{n.message}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(n.createdAt).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })}
                {n.read ? ` · ${t('notif.read')}` : ''}
              </span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={markAll} className="justify-center text-brand-600">
          <CheckCheck className="size-4" />
          {t('notif.markAllRead')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';
import { Button } from '@/components/ui/button';
import { NotificationsBell } from './NotificationsBell';
import { LanguageToggle } from './LanguageToggle';
import { cn } from 'cn';

function NavItem({ to, label, onClick }: { to: string; label: string; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'block rounded-lg px-3 py-2 text-sm font-medium transition',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )
      }
    >
      {label}
    </NavLink>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const isAdmin = user?.role === 'hr_admin';
  const close = () => setOpen(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const links = isAdmin
    ? [
        { to: '/admin', label: t('nav.dashboard') },
        { to: '/admin/karyawan', label: t('nav.employees') },
        { to: '/admin/monitoring', label: t('nav.monitoring') },
        { to: '/admin/rekap', label: t('nav.recap') },
        { to: '/admin/audit', label: t('nav.audit') },
        { to: '/admin/pengaturan', label: t('nav.settings') },
        { to: '/ganti-password', label: t('nav.changePassword') },
      ]
    : [
        { to: '/', label: t('nav.home') },
        { to: '/riwayat', label: t('nav.history') },
        { to: '/ganti-password', label: t('nav.changePassword') },
      ];

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              A
            </span>
            <div>
              <div className="text-sm font-semibold leading-tight">{t('app.name')}</div>
              <div className="text-xs text-muted-foreground">
                {isAdmin ? t('layout.adminModule') : t('layout.wfh')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium">{user?.fullName}</div>
              <div className="text-xs text-muted-foreground">{user?.employeeCode}</div>
            </div>
            {isAdmin && <NotificationsBell />}
            <LanguageToggle />
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="size-4" />
              <span className="hidden sm:inline">{t('layout.logout')}</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="sm:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label={t('layout.menu')}
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </Button>
          </div>
        </div>

        {/* Nav mobile */}
        {open && (
          <nav className="border-t bg-background px-4 py-2 sm:hidden">
            {links.map((l) => (
              <NavItem key={l.to} to={l.to} label={l.label} onClick={close} />
            ))}
          </nav>
        )}
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        {/* Sidebar desktop */}
        <aside className="hidden w-56 shrink-0 sm:block">
          <nav className="sticky top-20 space-y-1 rounded-xl border bg-background p-3">
            {links.map((l) => (
              <NavItem key={l.to} to={l.to} label={l.label} />
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

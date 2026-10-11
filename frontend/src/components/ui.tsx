import type { ReactNode } from 'react';
import { cn } from 'cn';
import { useI18n } from '../i18n';
import { Button as ShadcnButton } from '@/components/ui/button';
import { Card as ShadcnCard } from '@/components/ui/card';
import { Badge as ShadcnBadge } from '@/components/ui/badge';
import { Alert as ShadcnAlert } from '@/components/ui/alert';
import { Label as ShadcnLabel } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <ShadcnCard className={cn('p-4', className)}>{children}</ShadcnCard>;
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
      {label ?? t('common.loading')}
    </div>
  );
}

const alertKinds = {
  error: 'border-destructive/30 bg-destructive/5 text-destructive',
  success: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700',
  info: 'border-sky-500/30 bg-sky-500/5 text-sky-700',
} as const;

export function Alert({ kind, children }: { kind: 'error' | 'success' | 'info'; children: ReactNode }) {
  return (
    <ShadcnAlert className={cn(alertKinds[kind])}>
      <div className="text-sm">{children}</div>
    </ShadcnAlert>
  );
}

const badgeColors = {
  slate: 'bg-slate-100 text-slate-700',
  green: 'bg-emerald-100 text-emerald-700',
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  blue: 'bg-sky-100 text-sky-700',
} as const;

export function Badge({ children, color = 'slate' }: { children: ReactNode; color?: string }) {
  return (
    <ShadcnBadge variant="outline" className={cn('border-transparent', badgeColors[color as keyof typeof badgeColors] ?? badgeColors.slate)}>
      {children}
    </ShadcnBadge>
  );
}

const buttonVariants = {
  primary: 'default',
  secondary: 'outline',
  danger: 'destructive',
} as const;

export function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
}) {
  return (
    <ShadcnButton
      type={type}
      onClick={onClick}
      disabled={disabled}
      variant={buttonVariants[variant]}
      className={className}
    >
      {children}
    </ShadcnButton>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="grid gap-1.5">
      <ShadcnLabel>{label}</ShadcnLabel>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

/** Gaya input shadcn untuk dipakai pada <input>/<textarea> polos. */
export const inputCls =
  'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50';

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function Pagination({
  page,
  total,
  limit,
  onChange,
}: {
  page: number;
  total: number;
  limit: number;
  onChange: (p: number) => void;
}) {
  const { t } = useI18n();
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className="text-muted-foreground">
        {t('pagination.info', { page, pages, total })}
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          ←
        </Button>
        <Button variant="secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          →
        </Button>
      </div>
    </div>
  );
}

export { DialogDescription };

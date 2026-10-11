import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Plus, KeyRound, Pencil, UserX, UserCheck } from 'lucide-react';
import { api, ApiError } from '../../api/client';
import { useI18n } from '../../i18n';
import type { User, UserRole } from '../../api/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const EMPTY_FORM = {
  employeeCode: '',
  fullName: '',
  email: '',
  phone: '',
  department: '',
  position: '',
  joinDate: '',
  role: 'employee' as UserRole,
  isActive: true,
  password: '',
};

export function EmployeesPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [depts, setDepts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [newPass, setNewPass] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.employees({ page, limit, search, department, status });
      setRows(res.items);
      setTotal(res.total);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('empPage.loadError'));
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, department, status, t]);

  useEffect(() => {
    load();
  }, [load]);

  const loadDepartments = useCallback(async () => {
    try {
      setDepts(await api.departments());
    } catch {
      /* netral: pilihan departemen hanya pelengkap filter */
    }
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(u: User) {
    setEditing(u);
    setForm({
      employeeCode: u.employeeCode,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone ?? '',
      department: u.department ?? '',
      position: u.position ?? '',
      joinDate: u.joinDate ?? '',
      role: u.role,
      isActive: u.isActive,
      password: '',
    });
    setFormOpen(true);
  }

  async function submitForm(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const payload: Record<string, unknown> = {
          employeeCode: form.employeeCode,
          fullName: form.fullName,
          email: form.email,
          phone: form.phone || null,
          department: form.department || null,
          position: form.position || null,
          joinDate: form.joinDate || null,
          role: form.role,
          isActive: form.isActive,
        };
        await api.updateEmployee(editing.id, payload);
        toast.success(t('empPage.updated'));
      } else {
        await api.createEmployee({
          ...form,
          phone: form.phone || null,
          department: form.department || null,
          position: form.position || null,
          joinDate: form.joinDate || null,
        });
        toast.success(t('empPage.created'));
        setPage(1);
      }
      setFormOpen(false);
      await load();
      await loadDepartments();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('empPage.saveError'));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u: User) {
    try {
      await api.setActive(u.id, !u.isActive);
      toast.success(u.isActive ? t('empPage.deactivated') : t('empPage.activated'));
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('empPage.toggleError'));
    }
  }

  async function submitReset(e: FormEvent) {
    e.preventDefault();
    if (!resetTarget) return;
    if (newPass.length < 8) {
      toast.error(t('empPage.pwTooShort'));
      return;
    }
    setSaving(true);
    try {
      await api.resetPassword(resetTarget.id, newPass);
      toast.success(t('empPage.resetOk', { code: resetTarget.employeeCode }));
      setResetTarget(null);
      setNewPass('');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('empPage.resetError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={t('empPage.title')}
        subtitle={t('empPage.subtitle')}
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            {t('empPage.add')}
          </Button>
        }
      />

      {/* Filter */}
      <Card className="mb-4">
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Input
            placeholder={t('empPage.search')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Select
            value={department}
            onValueChange={(v) => {
              setDepartment(v ?? '');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('empPage.allDept')}>
                {(v) => (v ? String(v) : t('empPage.allDept'))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('empPage.allDept')}</SelectItem>
              {depts.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v ?? '');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('empPage.allStatus')}>
                {(v) =>
                  v === 'active'
                    ? t('status.active')
                    : v === 'inactive'
                      ? t('status.inactive')
                      : t('empPage.allStatus')
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('empPage.allStatus')}</SelectItem>
              <SelectItem value="active">{t('status.active')}</SelectItem>
              <SelectItem value="inactive">{t('status.inactive')}</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-sm text-muted-foreground sm:text-right">
            {t('common.employeesCount', { n: total })}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Spinner />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('th.id')}</TableHead>
                <TableHead>{t('th.nama')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('th.email')}</TableHead>
                <TableHead className="hidden lg:table-cell">{t('th.departemen')}</TableHead>
                <TableHead className="hidden lg:table-cell">{t('th.jabatan')}</TableHead>
                <TableHead>{t('th.status')}</TableHead>
                <TableHead className="text-right">{t('th.aksi')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono">{u.employeeCode}</TableCell>
                  <TableCell className="font-medium">{u.fullName}</TableCell>
                  <TableCell className="hidden md:table-cell">{u.email}</TableCell>
                  <TableCell className="hidden lg:table-cell">{u.department || '-'}</TableCell>
                  <TableCell className="hidden lg:table-cell">{u.position || '-'}</TableCell>
                  <TableCell>
                    {u.isActive ? (
                      <Badge className="bg-emerald-100 text-emerald-700">{t('status.active')}</Badge>
                    ) : (
                      <Badge variant="destructive">{t('status.inactive')}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                        <Pencil className="size-3.5" />
                        {t('common.edit')}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setResetTarget(u)}>
                        <KeyRound className="size-3.5" />
                        {t('empPage.resetPw')}
                      </Button>
                      <Button
                        variant={u.isActive ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => toggleActive(u)}
                      >
                        {u.isActive ? <UserX className="size-3.5" /> : <UserCheck className="size-3.5" />}
                        {u.isActive ? t('empPage.deactivate') : t('empPage.activate')}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
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

      {/* Form tambah/ubah */}
      {formOpen && (
        <Modal
          title={editing ? t('empPage.editTitle', { code: editing.employeeCode }) : t('empPage.createTitle')}
          onClose={() => !saving && setFormOpen(false)}
        >
          <form onSubmit={submitForm} className="grid gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>{t('empPage.idNik')}</Label>
                <Input value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} required />
              </div>
              <div className="grid gap-1.5">
                <Label>{t('empPage.fullName')}</Label>
                <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
              </div>
              <div className="grid gap-1.5">
                <Label>{t('th.email')}</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="grid gap-1.5">
                <Label>{t('empPage.phone')}</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>{t('empPage.department')}</Label>
                <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>{t('empPage.position')}</Label>
                <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>{t('empPage.joinDate')}</Label>
                <Input type="date" value={form.joinDate} onChange={(e) => setForm({ ...form, joinDate: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>{t('empPage.role')}</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRole })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">{t('empPage.roleEmployee')}</SelectItem>
                    <SelectItem value="hr_admin">{t('empPage.roleAdmin')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {!editing && (
              <div className="grid gap-1.5">
                <Label>{t('empPage.initialPassword')}</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                <span className="text-xs text-muted-foreground">{t('common.minChars')}</span>
              </div>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              {t('empPage.accountActive')}
            </label>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => !saving && setFormOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal reset password */}
      {resetTarget && (
        <Modal
          title={t('empPage.resetTitle', { code: resetTarget.employeeCode })}
          onClose={() => !saving && setResetTarget(null)}
        >
          <form onSubmit={submitReset} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label>{t('empPage.newPassword')}</Label>
              <Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} required />
              <span className="text-xs text-muted-foreground">{t('common.minChars')}</span>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => !saving && setResetTarget(null)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? t('common.saving') : t('common.resetPassword')}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

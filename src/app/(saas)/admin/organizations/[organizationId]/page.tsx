'use client';

import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import {
  ArrowLeft,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  MonitorSmartphone,
  Pencil,
  Plus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AdminOrganizationsProvider,
  useAdminOrganizations,
  useApp,
  useAuth,
  usePermissions,
} from '@/core/application/contexts';
import { useI18n } from '@/i18n';

const MEMBERS_PER_PAGE = 10;

function OrganizationDetailContent() {
  const router = useRouter();
  const params = useParams();
  const organizationId = params.organizationId as string;
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { isAppLoading } = useApp();
  const { isSuperAdmin } = usePermissions();
  const {
    selectedOrganization: org,
    isLoadingDetail,
    availablePlans,
    fetchOrganization,
    updateOrganization,
    assignSubscription,
    addMember,
    fetchAvailablePlans,
  } = useAdminOrganizations();
  const { t, locale } = useI18n();

  const formatDate = (value: Date | string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value));

  const isLoading = isAppLoading || isAuthLoading;

  // ── Info card edit state ──────────────────────────────────────
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  // ── Subscription modal state ──────────────────────────────────
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [subStartedAt, setSubStartedAt] = useState('');
  const [subExpiresAt, setSubExpiresAt] = useState('');
  const [isSavingSub, setIsSavingSub] = useState(false);

  // ── Members state ─────────────────────────────────────────────
  const [membersPage, setMembersPage] = useState(1);
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'ORG_OWNER' | 'EVENT_MANAGER'>('ORG_OWNER');
  const [isSavingMember, setIsSavingMember] = useState(false);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isSuperAdmin())) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, isSuperAdmin, router]);

  useEffect(() => {
    if (isAuthenticated && isSuperAdmin() && organizationId) {
      fetchOrganization(organizationId);
    }
  }, [isAuthenticated, isSuperAdmin, organizationId, fetchOrganization]);

  // Sync edit fields when org loads or changes
  useEffect(() => {
    if (org) {
      setEditName(org.name);
      setEditEmail(org.email ?? '');
      setEditPhone(org.phone ?? '');
    }
  }, [org]);

  // ── Paginated members ─────────────────────────────────────────
  const paginatedMembers = useMemo(() => {
    if (!org) return { items: [], totalPages: 0 };
    const totalPages = Math.max(1, Math.ceil(org.members.length / MEMBERS_PER_PAGE));
    const start = (membersPage - 1) * MEMBERS_PER_PAGE;
    const items = org.members.slice(start, start + MEMBERS_PER_PAGE);
    return { items, totalPages };
  }, [org, membersPage]);

  // ── Handlers ──────────────────────────────────────────────────
  async function handleSaveInfo() {
    if (!org) return;
    setIsSavingInfo(true);
    try {
      await updateOrganization(org.id, {
        name: editName,
        email: editEmail || null,
        phone: editPhone || null,
      });
      // Refetch detail to reflect changes everywhere on the page
      await fetchOrganization(org.id);
      setIsEditingInfo(false);
      toast.success(t('organizations.messages.updateSuccess'));
    } catch {
      toast.error(t('organizations.messages.updateError'));
    } finally {
      setIsSavingInfo(false);
    }
  }

  function handleCancelEdit() {
    if (!org) return;
    setEditName(org.name);
    setEditEmail(org.email ?? '');
    setEditPhone(org.phone ?? '');
    setIsEditingInfo(false);
  }

  function handleOpenSubscriptionModal() {
    if (org?.subscription) {
      setSelectedPlanId(org.subscription.planId);
      setSubStartedAt(new Date(org.subscription.startedAt).toISOString().split('T')[0]);
      setSubExpiresAt(new Date(org.subscription.expiresAt).toISOString().split('T')[0]);
    } else {
      setSelectedPlanId('');
      const today = new Date().toISOString().split('T')[0];
      setSubStartedAt(today);
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      setSubExpiresAt(nextYear.toISOString().split('T')[0]);
    }
    fetchAvailablePlans();
    setSubscriptionModalOpen(true);
  }

  async function handleSaveSubscription(e: React.FormEvent) {
    e.preventDefault();
    if (!org) return;
    setIsSavingSub(true);
    try {
      await assignSubscription(org.id, {
        planId: selectedPlanId,
        startedAt: new Date(subStartedAt).toISOString(),
        expiresAt: new Date(subExpiresAt).toISOString(),
      });
      await fetchOrganization(org.id);
      setSubscriptionModalOpen(false);
      toast.success(t('organizations.messages.subscriptionSuccess'));
    } catch {
      toast.error(t('organizations.messages.subscriptionError'));
    } finally {
      setIsSavingSub(false);
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!org) return;
    setIsSavingMember(true);
    try {
      await addMember(org.id, {
        name: newMemberName,
        email: newMemberEmail,
        role: newMemberRole,
      });
      setAddMemberModalOpen(false);
      setNewMemberName('');
      setNewMemberEmail('');
      setNewMemberRole('ORG_OWNER');
      toast.success(t('organizations.messages.memberAddSuccess'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('organizations.messages.memberAddError');
      toast.error(message);
    } finally {
      setIsSavingMember(false);
    }
  }

  if (isLoading || !isAuthenticated || !isSuperAdmin()) {
    return null;
  }

  if (isLoadingDetail) {
    return <DetailSkeleton />;
  }

  if (!org) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">{t('organizations.list.noOrgs')}</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/admin/organizations">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.actions.back')}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/organizations">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
            <Building2 className="text-primary h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{org.name}</h1>
              <Badge
                variant="outline"
                className={org.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-400/10 text-gray-500'}
              >
                {org.isActive ? t('common.status.active') : t('common.status.inactive')}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">{org.slug}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title={t('organizations.detail.events')}
          value={org._count.events}
          icon={<Calendar className="text-muted-foreground h-4 w-4" />}
        />
        <StatCard
          title={t('organizations.detail.members')}
          value={org._count.members}
          icon={<Users className="text-muted-foreground h-4 w-4" />}
        />
        <StatCard
          title={t('dashboard.superAdmin.participants')}
          value={org._count.participants}
          icon={<Users className="text-muted-foreground h-4 w-4" />}
        />
        <StatCard
          title={t('nav.sidebar.totems')}
          value={org._count.totems}
          icon={<MonitorSmartphone className="text-muted-foreground h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Organization Info - Editable */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('organizations.detail.info')}</CardTitle>
              {!isEditingInfo && (
                <Button variant="ghost" size="icon" onClick={() => setIsEditingInfo(true)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isEditingInfo ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">{t('common.labels.name')}</Label>
                  <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">{t('organizations.form.phone')}</Label>
                  <Input id="edit-phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                </div>
                <InfoRow label="Slug" value={org.slug} />
                <InfoRow
                  label={t('common.labels.status')}
                  value={org.isActive ? t('common.status.active') : t('common.status.inactive')}
                />
                <InfoRow label={t('common.labels.createdAt')} value={formatDate(org.createdAt)} />
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={isSavingInfo}>
                    {t('common.actions.cancel')}
                  </Button>
                  <Button size="sm" onClick={handleSaveInfo} disabled={isSavingInfo || !editName.trim()}>
                    {isSavingInfo ? t('common.actions.loading') : t('common.actions.save')}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <InfoRow label={t('common.labels.name')} value={org.name} />
                <InfoRow label="Slug" value={org.slug} />
                <InfoRow label="Email" value={org.email ?? '—'} />
                <InfoRow label={t('organizations.form.phone')} value={org.phone ?? '—'} />
                <InfoRow
                  label={t('common.labels.status')}
                  value={org.isActive ? t('common.status.active') : t('common.status.inactive')}
                />
                <InfoRow label={t('common.labels.createdAt')} value={formatDate(org.createdAt)} />
              </>
            )}
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Subscription
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={handleOpenSubscriptionModal}>
                {org.subscription ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {org.subscription ? (
              <div className="space-y-3">
                <InfoRow label={t('organizations.detail.currentPlan')} value={org.subscription.planName} />
                <InfoRow label={t('organizations.detail.startedAt')} value={formatDate(org.subscription.startedAt)} />
                <InfoRow label={t('organizations.detail.expiresAt')} value={formatDate(org.subscription.expiresAt)} />
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{t('organizations.detail.noSubscription')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('organizations.detail.members')}</CardTitle>
              <CardDescription>
                {t('organizations.detail.membersDescription', { count: String(org.members.length) })}
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setAddMemberModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('organizations.detail.addMember')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {org.members.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">{t('organizations.detail.noMembers')}</p>
          ) : (
            <>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('common.labels.name')}</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>{t('common.labels.role')}</TableHead>
                      <TableHead>{t('common.labels.createdAt')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedMembers.items.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.userName}</TableCell>
                        <TableCell className="text-muted-foreground">{member.userEmail}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{member.role}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(member.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {paginatedMembers.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-muted-foreground text-sm">
                    {t('common.labels.showing')} {(membersPage - 1) * MEMBERS_PER_PAGE + 1}–
                    {Math.min(membersPage * MEMBERS_PER_PAGE, org.members.length)} {t('common.labels.of')}{' '}
                    {org.members.length}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={membersPage === 1}
                      onClick={() => setMembersPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={membersPage === paginatedMembers.totalPages}
                      onClick={() => setMembersPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Assign Subscription Modal ───────────────────────────── */}
      <Dialog open={subscriptionModalOpen} onOpenChange={setSubscriptionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('organizations.detail.assignSubscription')}</DialogTitle>
            <DialogDescription>{t('organizations.detail.assignSubscriptionDescription')}</DialogDescription>
          </DialogHeader>

          {availablePlans.length === 0 ? (
            <div className="space-y-4 py-4">
              <p className="text-muted-foreground text-sm">{t('organizations.detail.noPlansAvailable')}</p>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/admin/plans">{t('organizations.detail.createPlan')}</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSaveSubscription} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('organizations.detail.plan')}</Label>
                <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('organizations.form.selectPlan')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('organizations.detail.startedAt')}</Label>
                <Input type="date" value={subStartedAt} onChange={(e) => setSubStartedAt(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label>{t('organizations.detail.expiresAt')}</Label>
                <Input type="date" value={subExpiresAt} onChange={(e) => setSubExpiresAt(e.target.value)} required />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSubscriptionModalOpen(false)}>
                  {t('common.actions.cancel')}
                </Button>
                <Button type="submit" disabled={isSavingSub || !selectedPlanId}>
                  {isSavingSub ? t('common.actions.loading') : t('common.actions.save')}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Add Member Modal ────────────────────────────────────── */}
      <Dialog
        open={addMemberModalOpen}
        onOpenChange={(v: boolean) => {
          if (!v) {
            setNewMemberName('');
            setNewMemberEmail('');
            setNewMemberRole('ORG_OWNER');
          }
          setAddMemberModalOpen(v);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('organizations.detail.addMember')}</DialogTitle>
            <DialogDescription>{t('organizations.detail.addMemberDescription')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member-name">{t('common.labels.name')}</Label>
              <Input
                id="member-name"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-email">{t('common.labels.email')}</Label>
              <Input
                id="member-email"
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="john@company.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>{t('common.labels.role')}</Label>
              <Select
                value={newMemberRole}
                onValueChange={(v: string) => setNewMemberRole(v as 'ORG_OWNER' | 'EVENT_MANAGER')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ORG_OWNER">{t('nav.roleLabels.ORG_OWNER')}</SelectItem>
                  <SelectItem value="EVENT_MANAGER">{t('nav.roleLabels.EVENT_MANAGER')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('common.labels.organization')}</Label>
              <Input value={org.name} disabled className="bg-muted" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddMemberModalOpen(false)}>
                {t('common.actions.cancel')}
              </Button>
              <Button type="submit" disabled={isSavingMember}>
                {isSavingMember ? t('common.actions.loading') : t('common.actions.create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function OrganizationDetailPage() {
  return (
    <AdminOrganizationsProvider>
      <OrganizationDetailContent />
    </AdminOrganizationsProvider>
  );
}

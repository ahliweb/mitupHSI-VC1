import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Mail, Send, X, CheckCircle, XCircle, Clock, 
  RefreshCw, MoreVertical, Copy, ExternalLink, 
  UserPlus, AlertCircle, Trash2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Form, FormControl, FormDescription, FormField, 
  FormItem, FormLabel, FormMessage 
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/contexts/PermissionContext';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/lib/customSupabaseClient';
import { AdminPageLayout, PageHeader } from '@/templates/flowbite-admin';
import { cn } from '@/lib/utils';

function InvitationManagementPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { hasPermission, isPlatformAdmin } = usePermissions();
  const { currentTenant } = useTenant();
  
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  
  const [inviteData, setInviteData] = useState({
    email: '',
    role_id: '',
    tenant_id: '',
    message: ''
  });
  
  const [roles, setRoles] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');

  const canInvite = hasPermission('tenant.user.create') || hasPermission('tenant.user.invite');

  const fetchInvitations = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('user_invitations')
        .select('*, roles(name), tenants(name)')
        .order('created_at', { ascending: false });

      if (!isPlatformAdmin && currentTenant?.id) {
        query = query.eq('tenant_id', currentTenant.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setInvitations(data || []);
    } catch (err) {
      console.error('Error fetching invitations:', err);
    } finally {
      setLoading(false);
    }
  }, [isPlatformAdmin, currentTenant]);

  const fetchRolesAndTenants = async () => {
    const [rolesRes, tenantsRes] = await Promise.all([
      supabase.from('roles').select('id, name, scope, tenant_id').is('deleted_at', null).order('name'),
      isPlatformAdmin ? supabase.from('tenants').select('id, name').is('deleted_at', null).order('name') : Promise.resolve({ data: [] })
    ]);
    
    setRoles(rolesRes.data || []);
    setTenants(tenantsRes.data || []);
  };

  useEffect(() => {
    fetchInvitations();
    fetchRolesAndTenants();
  }, [fetchInvitations]);

  const handleSendInvitation = async (e) => {
    e.preventDefault();
    setSending(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'invite',
          email: inviteData.email,
          role_id: inviteData.role_id,
          tenant_id: inviteData.tenant_id || currentTenant?.id,
          message: inviteData.message
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: t('invitations.sent'), description: t('invitations.sent_desc') });
      setInviteDialogOpen(false);
      setInviteData({ email: '', role_id: '', tenant_id: '', message: '' });
      fetchInvitations();
    } catch (err) {
      toast({ variant: 'destructive', title: t('common.error'), description: err.message });
    } finally {
      setSending(false);
    }
  };

  const handleResendInvitation = async (invitationId) => {
    try {
      const { error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'resend_invite',
          invitation_id: invitationId
        }
      });

      if (error) throw error;
      toast({ title: t('invitations.resent'), description: t('invitations.resent_desc') });
    } catch (err) {
      toast({ variant: 'destructive', title: t('common.error'), description: err.message });
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    try {
      const { error } = await supabase
        .from('user_invitations')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('id', invitationId);

      if (error) throw error;
      toast({ title: t('invitations.cancelled'), description: t('invitations.cancelled_desc') });
      fetchInvitations();
    } catch (err) {
      toast({ variant: 'destructive', title: t('common.error'), description: err.message });
    }
  };

  const copyInviteLink = (token) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    toast({ title: t('invitations.link_copied') });
  };

  const filteredInvitations = invitations.filter(inv => {
    if (activeTab === 'pending') return inv.status === 'pending';
    if (activeTab === 'accepted') return inv.status === 'accepted';
    if (activeTab === 'expired') return inv.status === 'expired' || inv.status === 'cancelled';
    return true;
  });

  const stats = {
    total: invitations.length,
    pending: invitations.filter(i => i.status === 'pending').length,
    accepted: invitations.filter(i => i.status === 'accepted').length,
    expired: invitations.filter(i => i.status === 'expired' || i.status === 'cancelled').length,
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> {t('invitations.pending')}</Badge>;
      case 'accepted':
        return <Badge className="bg-green-500 gap-1"><CheckCircle className="h-3 w-3" /> {t('invitations.accepted')}</Badge>;
      case 'expired':
        return <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" /> {t('invitations.expired')}</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> {t('invitations.cancelled')}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDaysRemaining = (expiresAt) => {
    if (!expiresAt) return '-';
    const days = Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} ${t('invitations.days')}` : t('invitations.expired');
  };

  if (!canInvite) {
    return (
      <AdminPageLayout requiredPermission="tenant.user.read">
        <div className="flex flex-col items-center justify-center h-96">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t('invitations.no_permission')}</p>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout requiredPermission="tenant.user.read">
      <PageHeader
        title={t('invitations.title')}
        description={t('invitations.description')}
        icon={Mail}
        breadcrumbs={[
          { label: t('users.title'), href: '/cmspanel/users' },
          { label: t('invitations.title') }
        ]}
        actions={
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                {t('invitations.send_invite')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('invitations.send_invite')}</DialogTitle>
                <DialogDescription>
                  {t('invitations.send_invite_desc')}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSendInvitation} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('users.columns.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteData.email}
                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                    placeholder="user@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('users.columns.role')}</Label>
                  <Select
                    value={inviteData.role_id}
                    onValueChange={(value) => setInviteData({ ...inviteData, role_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('invitations.select_role')} />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isPlatformAdmin && (
                  <div className="space-y-2">
                    <Label>{t('users.columns.tenant')}</Label>
                    <Select
                      value={inviteData.tenant_id}
                      onValueChange={(value) => setInviteData({ ...inviteData, tenant_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('invitations.select_tenant')} />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>{t('invitations.message')}</Label>
                  <Input
                    value={inviteData.message}
                    onChange={(e) => setInviteData({ ...inviteData, message: e.target.value })}
                    placeholder={t('invitations.message_placeholder')}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={sending}>
                    {sending ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    {t('invitations.send')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('invitations.total')}</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('invitations.pending')}</CardDescription>
              <CardTitle className="text-3xl text-yellow-600">{stats.pending}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('invitations.accepted')}</CardDescription>
              <CardTitle className="text-3xl text-green-600">{stats.accepted}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('invitations.expired')}</CardDescription>
              <CardTitle className="text-3xl text-muted-foreground">{stats.expired}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Invitations Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('invitations.all_invitations')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all">{t('common.all')} ({stats.total})</TabsTrigger>
                <TabsTrigger value="pending">{t('invitations.pending')} ({stats.pending})</TabsTrigger>
                <TabsTrigger value="accepted">{t('invitations.accepted')} ({stats.accepted})</TabsTrigger>
                <TabsTrigger value="expired">{t('invitations.expired')} ({stats.expired})</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('users.columns.email')}</TableHead>
                      <TableHead>{t('users.columns.role')}</TableHead>
                      {isPlatformAdmin && <TableHead>{t('users.columns.tenant')}</TableHead>}
                      <TableHead>{t('invitations.sent_by')}</TableHead>
                      <TableHead>{t('invitations.expires')}</TableHead>
                      <TableHead>{t('common.status')}</TableHead>
                      <TableHead className="text-right">{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredInvitations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          {t('invitations.no_invitations')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInvitations.map((invitation) => (
                        <TableRow key={invitation.id}>
                          <TableCell className="font-medium">{invitation.email}</TableCell>
                          <TableCell>{invitation.roles?.name || '-'}</TableCell>
                          {isPlatformAdmin && <TableCell>{invitation.tenants?.name || '-'}</TableCell>}
                          <TableCell>
                            {invitation.invited_by ? (
                              <span className="text-muted-foreground">{invitation.invited_by}</span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {getDaysRemaining(invitation.expires_at)}
                          </TableCell>
                          <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {invitation.status === 'pending' && (
                                  <>
                                    <DropdownMenuItem onClick={() => copyInviteLink(invitation.token)}>
                                      <Copy className="h-4 w-4 mr-2" />
                                      {t('invitations.copy_link')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleResendInvitation(invitation.id)}>
                                      <Send className="h-4 w-4 mr-2" />
                                      {t('invitations.resend')}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleCancelInvitation(invitation.id)}
                                      className="text-destructive"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      {t('invitations.cancel')}
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {invitation.status === 'accepted' && (
                                  <DropdownMenuItem>
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    {t('invitations.view_user')}
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
}

export default InvitationManagementPage;

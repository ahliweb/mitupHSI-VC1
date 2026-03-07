import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserPlus, Search, Filter, MoreVertical, 
  Shield, Mail, Phone, Building, Calendar, 
  Edit, Trash2, RefreshCw, CheckCircle, XCircle,
  ChevronLeft, ChevronRight, Download
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/contexts/PermissionContext';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/lib/customSupabaseClient';
import { AdminPageLayout, PageHeader } from '@/templates/flowbite-admin';
import { cn } from '@/lib/utils';

function TenantUserManagementPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { currentTenant } = useTenant();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const canView = hasPermission('tenant.user.read');
  const canCreate = hasPermission('tenant.user.create');
  const canEdit = hasPermission('tenant.user.update');
  const canDelete = hasPermission('tenant.user.delete');

  const fetchUsers = useCallback(async () => {
    if (!canView || !currentTenant?.id) return;
    setLoading(true);
    
    try {
      let query = supabase
        .from('users')
        .select(`
          *,
          roles:roles!users_role_id_fkey(name, is_platform_admin, is_full_access, is_tenant_admin),
          profile:user_profiles!user_profiles_user_id_fkey(job_title, department, phone)
        `, { count: 'exact' })
        .eq('tenant_id', currentTenant.id)
        .is('deleted_at', null);

      if (searchQuery) {
        query = query.or(`email.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`);
      }

      if (roleFilter !== 'all') {
        query = query.eq('role_id', roleFilter);
      }

      if (statusFilter !== 'all') {
        query = query.eq('approval_status', statusFilter);
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, count, error } = await query
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
      setTotalItems(count || 0);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast({ variant: 'destructive', title: t('common.error'), description: t('users.errors.fetch_failed') });
    } finally {
      setLoading(false);
    }
  }, [canView, currentTenant, searchQuery, roleFilter, statusFilter, currentPage, itemsPerPage, toast, t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleEditUser = (user) => {
    navigate(`/cmspanel/users/edit/${user.id}`);
  };

  const handleDeleteUser = async (userId) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
      toast({ title: t('common.success'), description: t('users.delete_success') });
      fetchUsers();
    } catch (err) {
      toast({ variant: 'destructive', title: t('common.error'), description: err.message });
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          approval_status: 'approved',
          admin_approved_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      toast({ title: t('common.success'), description: t('users.approve_success') });
      fetchUsers();
    } catch (err) {
      toast({ variant: 'destructive', title: t('common.error'), description: err.message });
    }
  };

  const handleRejectUser = async (userId) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          approval_status: 'rejected',
          admin_approved_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      toast({ title: t('common.success'), description: t('users.reject_success') });
      fetchUsers();
    } catch (err) {
      toast({ variant: 'destructive', title: t('common.error'), description: err.message });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500 gap-1"><CheckCircle className="h-3 w-3" /> {t('users.status.approved')}</Badge>;
      case 'pending_admin':
      case 'pending':
        return <Badge variant="outline" className="gap-1 text-yellow-600"><Shield className="h-3 w-3" /> {t('users.status.pending')}</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> {t('users.status.rejected')}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const stats = {
    total: totalItems,
    active: users.filter(u => u.approval_status === 'approved').length,
    pending: users.filter(u => u.approval_status === 'pending' || u.approval_status === 'pending_admin').length,
  };

  if (!canView) {
    return (
      <AdminPageLayout requiredPermission="tenant.user.read">
        <div className="flex flex-col items-center justify-center h-96">
          <Shield className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t('common.access_denied')}</p>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout requiredPermission="tenant.user.read">
      <PageHeader
        title={t('tenant_users.title', { tenant: currentTenant?.name })}
        description={t('tenant_users.description')}
        icon={Users}
        breadcrumbs={[
          { label: t('tenant_users.title') }
        ]}
        actions={
          canCreate && (
            <Button onClick={() => navigate('/cmspanel/users/new')}>
              <UserPlus className="h-4 w-4 mr-2" />
              {t('users.create_user')}
            </Button>
          )
        }
      />

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('tenant_users.total_users')}</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('tenant_users.active_users')}</CardDescription>
              <CardTitle className="text-3xl text-green-600">{stats.active}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('tenant_users.pending_approval')}</CardDescription>
              <CardTitle className="text-3xl text-yellow-600">{stats.pending}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('tenant_users.search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="all">{t('common.all_roles')}</option>
                  <option value="admin">{t('roles.admin')}</option>
                  <option value="staff">{t('roles.staff')}</option>
                  <option value="member">{t('roles.member')}</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="all">{t('common.all_status')}</option>
                  <option value="approved">{t('users.status.approved')}</option>
                  <option value="pending">{t('users.status.pending')}</option>
                  <option value="rejected">{t('users.status.rejected')}</option>
                </select>
                <Button variant="outline" onClick={fetchUsers}>
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('users.columns.user')}</TableHead>
                  <TableHead>{t('users.columns.role')}</TableHead>
                  <TableHead>{t('users.columns.contact')}</TableHead>
                  <TableHead>{t('users.columns.status')}</TableHead>
                  <TableHead>{t('users.columns.joined')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      {t('tenant_users.no_users')}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {user.full_name?.[0] || user.email[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{user.full_name || t('users.guest')}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.roles?.is_tenant_admin ? (
                          <Badge className="bg-purple-500">{t('roles.admin')}</Badge>
                        ) : (
                          <Badge variant="outline">{user.roles?.name || t('users.guest')}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {user.profile?.phone && (
                            <p className="text-sm flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {user.profile.phone}
                            </p>
                          )}
                          {user.profile?.department && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {user.profile.department}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(user.approval_status)}</TableCell>
                      <TableCell>
                        <p className="text-sm">{new Date(user.created_at).toLocaleDateString()}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEdit && (
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                <Edit className="h-4 w-4 mr-2" />
                                {t('common.edit')}
                              </DropdownMenuItem>
                            )}
                            {canEdit && user.approval_status === 'pending' && (
                              <>
                                <DropdownMenuItem onClick={() => handleApproveUser(user.id)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  {t('users.approve')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRejectUser(user.id)} className="text-yellow-600">
                                  <XCircle className="h-4 w-4 mr-2" />
                                  {t('users.reject')}
                                </DropdownMenuItem>
                              </>
                            )}
                            {canDelete && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {t('common.delete')}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {t('common.showing')} {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} {t('common.of')} {totalItems}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalItems / itemsPerPage), p + 1))}
              disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
}

export default TenantUserManagementPage;

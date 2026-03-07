import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Shield, ShieldAlert, ShieldCheck, ShieldQuestion, 
  Activity, Clock, Globe, Monitor, Smartphone, Tablet, 
  LogOut, RefreshCw, MoreVertical, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { AdminPageLayout, PageHeader } from '@/templates/flowbite-admin';
import { cn } from '@/lib/utils';

function UserSessionsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, session } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingSession, setRevokingSession] = useState(null);

  const [activeTab, setActiveTab] = useState('all');

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSessions(data || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevokeSession = async (sessionId) => {
    setRevokingSession(sessionId);
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', sessionId);

      if (error) throw error;
      
      toast({ title: t('sessions.revoke_success'), description: t('sessions.revoke_success_desc') });
      fetchSessions();
    } catch (err) {
      toast({ variant: 'destructive', title: t('common.error'), description: err.message });
    } finally {
      setRevokingSession(null);
    }
  };

  const getDeviceIcon = (userAgent) => {
    if (!userAgent) return <Monitor className="h-4 w-4" />;
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android')) return <Smartphone className="h-4 w-4" />;
    if (ua.includes('tablet') || ua.includes('ipad')) return <Tablet className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  const getStatusBadge = (session) => {
    if (session.revoked_at) {
      return <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" /> {t('sessions.revoked')}</Badge>;
    }
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      return <Badge variant="outline" className="gap-1"><AlertTriangle className="h-3 w-3" /> {t('sessions.expired')}</Badge>;
    }
    if (session.id === session?.access_token) {
      return <Badge className="bg-green-500 gap-1"><CheckCircle className="h-3 w-3" /> {t('sessions.current')}</Badge>;
    }
    return <Badge variant="default" className="gap-1"><Activity className="h-3 w-3" /> {t('sessions.active')}</Badge>;
  };

  const filteredSessions = sessions.filter(s => {
    if (activeTab === 'active') return !s.revoked_at && (!s.expires_at || new Date(s.expires_at) > new Date());
    if (activeTab === 'revoked') return s.revoked_at;
    return true;
  });

  const stats = {
    total: sessions.length,
    active: sessions.filter(s => !s.revoked_at && (!s.expires_at || new Date(s.expires_at) > new Date())).length,
    revoked: sessions.filter(s => s.revoked_at).length,
  };

  return (
    <AdminPageLayout requiredPermission="tenant.user.read">
      <PageHeader
        title={t('sessions.title')}
        description={t('sessions.description')}
        icon={Shield}
        breadcrumbs={[
          { label: t('users.title'), href: '/cmspanel/users' },
          { label: t('sessions.title') }
        ]}
        actions={
          <Button onClick={fetchSessions} variant="outline" size="sm">
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            {t('common.refresh')}
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('sessions.total_sessions')}</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span className="text-sm">{t('sessions.all_time')}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('sessions.active_sessions')}</CardDescription>
              <CardTitle className="text-3xl text-green-600">{stats.active}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-green-600">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-sm">{t('sessions.currently_signed_in')}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('sessions.revoked_sessions')}</CardDescription>
              <CardTitle className="text-3xl text-muted-foreground">{stats.revoked}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShieldAlert className="h-4 w-4" />
                <span className="text-sm">{t('sessions.sign_out_remotely')}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sessions Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('sessions.sessions_list')}</CardTitle>
                <CardDescription>{t('sessions.sessions_list_desc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all">{t('common.all')} ({stats.total})</TabsTrigger>
                <TabsTrigger value="active">{t('sessions.active')} ({stats.active})</TabsTrigger>
                <TabsTrigger value="revoked">{t('sessions.revoked')} ({stats.revoked})</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('sessions.device')}</TableHead>
                      <TableHead>{t('sessions.location')}</TableHead>
                      <TableHead>{t('sessions.ip_address')}</TableHead>
                      <TableHead>{t('sessions.last_active')}</TableHead>
                      <TableHead>{t('sessions.status')}</TableHead>
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
                    ) : filteredSessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          {t('sessions.no_sessions')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {getDeviceIcon(session.user_agent)}
                              <div>
                                <p className="font-medium">{session.device_name || session.browser || 'Unknown Device'}</p>
                                <p className="text-xs text-muted-foreground">{session.os || 'Unknown OS'}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              <span>{session.country || session.city || 'Unknown Location'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {session.ip_address || '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{session.last_activity_at ? new Date(session.last_activity_at).toLocaleString() : '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(session)}
                          </TableCell>
                          <TableCell className="text-right">
                            {!session.revoked_at && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    onClick={() => handleRevokeSession(session.id)}
                                    disabled={revokingSession === session.id}
                                    className="text-destructive"
                                  >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    {revokingSession === session.id ? t('common.revoking') : t('sessions.revoke')}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
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

        {/* Security Tips */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldQuestion className="h-5 w-5" />
              {t('sessions.security_tips')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                {t('sessions.tip_1')}
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                {t('sessions.tip_2')}
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                {t('sessions.tip_3')}
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
}

export default UserSessionsPage;

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Shield, Lock, Key, Smartphone, Mail, Eye, EyeOff, 
  CheckCircle, XCircle, AlertTriangle, Loader2,
  ShieldCheck, ShieldAlert, History, Save
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage 
} from '@/components/ui/form';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { AdminPageLayout, PageHeader } from '@/templates/flowbite-admin';
import { cn } from '@/lib/utils';

function SecuritySettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [verifying2FA, setVerifying2FA] = useState(false);
  
  const [loginHistory, setLoginHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const passwordRequirements = [
    { key: 'length', label: t('security.at_least_8_chars'), test: (p) => p.length >= 8 },
    { key: 'uppercase', label: t('security.one_uppercase'), test: (p) => /[A-Z]/.test(p) },
    { key: 'lowercase', label: t('security.one_lowercase'), test: (p) => /[a-z]/.test(p) },
    { key: 'number', label: t('security.one_number'), test: (p) => /[0-9]/.test(p) },
    { key: 'special', label: t('security.one_special'), test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
  ];

  useEffect(() => {
    fetchSecurityStatus();
    fetchLoginHistory();
  }, []);

  const fetchSecurityStatus = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_security')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setTwoFactorEnabled(data.two_factor_enabled || false);
      }
    } catch (err) {
      console.log('No security record found');
    } finally {
      setLoading(false);
    }
  };

  const fetchLoginHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('action', 'user.login')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error) {
        setLoginHistory(data || []);
      }
    } catch (err) {
      console.error('Error fetching login history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ variant: 'destructive', title: t('common.error'), description: t('security.passwords_not_match') });
      return;
    }

    const valid = passwordRequirements.every(req => req.test(passwordData.newPassword));
    if (!valid) {
      toast({ variant: 'destructive', title: t('common.error'), description: t('security.password_requirements') });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('manage-security', {
        body: {
          action: 'change_password',
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }
      });

      if (error) throw error;
      
      toast({ title: t('common.success'), description: t('security.password_changed') });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast({ variant: 'destructive', title: t('common.error'), description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle2FA = async () => {
    if (!twoFactorEnabled) {
      setVerifying2FA(true);
      try {
        const { data, error } = await supabase.functions.invoke('manage-security', {
          body: { action: 'enable_2fa' }
        });
        
        if (error) throw error;
        toast({ title: t('common.success'), description: t('security.2fa_enabled') });
        setTwoFactorEnabled(true);
      } catch (err) {
        toast({ variant: 'destructive', title: t('common.error'), description: err.message });
      } finally {
        setVerifying2FA(false);
      }
    } else {
      try {
        await supabase.functions.invoke('manage-security', {
          body: { action: 'disable_2fa' }
        });
        toast({ title: t('common.success'), description: t('security.2fa_disabled') });
        setTwoFactorEnabled(false);
      } catch (err) {
        toast({ variant: 'destructive', title: t('common.error'), description: err.message });
      }
    }
  };

  const getPasswordStrength = () => {
    const password = passwordData.newPassword;
    if (!password) return { score: 0, label: t('security.no_password'), color: 'bg-gray-200' };
    
    const passed = passwordRequirements.filter(req => req.test(password)).length;
    if (passed <= 2) return { score: passed, label: t('security.weak'), color: 'bg-red-500' };
    if (passed <= 3) return { score: passed, label: t('security.fair'), color: 'bg-yellow-500' };
    if (passed <= 4) return { score: passed, label: t('security.good'), color: 'bg-blue-500' };
    return { score: passed, label: t('security.strong'), color: 'bg-green-500' };
  };

  const strength = getPasswordStrength();

  return (
    <AdminPageLayout requiredPermission="tenant.user.read">
      <PageHeader
        title={t('security.title')}
        description={t('security.description')}
        icon={Shield}
        breadcrumbs={[
          { label: t('settings.title'), href: '/cmspanel/settings' },
          { label: t('security.title') }
        ]}
      />

      <Tabs defaultValue="password" className="space-y-6">
        <TabsList>
          <TabsTrigger value="password" className="gap-2">
            <Lock className="h-4 w-4" />
            {t('security.password')}
          </TabsTrigger>
          <TabsTrigger value="twofactor" className="gap-2">
            <Smartphone className="h-4 w-4" />
            {t('security.two_factor')}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            {t('security.login_history')}
          </TabsTrigger>
        </TabsList>

        {/* Password Tab */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                {t('security.change_password')}
              </CardTitle>
              <CardDescription>
                {t('security.change_password_desc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">{t('security.current_password')}</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t('security.new_password')}</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  {passwordData.newPassword && (
                    <div className="space-y-2 pt-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={cn(
                              "h-1 flex-1 rounded-full transition-all",
                              level <= strength.score ? strength.color : "bg-gray-200"
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{strength.label}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('security.confirm_password')}</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                    <p className="text-xs text-destructive">{t('security.passwords_not_match')}</p>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-sm font-medium">{t('security.password_requirements')}</p>
                  <ul className="space-y-1">
                    {passwordRequirements.map((req) => (
                      <li key={req.key} className="flex items-center gap-2 text-sm">
                        {req.test(passwordData.newPassword) ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-300" />
                        )}
                        <span className={req.test(passwordData.newPassword) ? 'text-green-600' : 'text-muted-foreground'}>
                          {req.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {t('security.update_password')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Two-Factor Tab */}
        <TabsContent value="twofactor">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                {t('security.two_factor_auth')}
              </CardTitle>
              <CardDescription>
                {t('security.two_factor_desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-full",
                    twoFactorEnabled ? "bg-green-100" : "bg-gray-100"
                  )}>
                    {twoFactorEnabled ? (
                      <ShieldCheck className="h-6 w-6 text-green-600" />
                    ) : (
                      <ShieldAlert className="h-6 w-6 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{t('security.two_factor_status')}</p>
                    <p className="text-sm text-muted-foreground">
                      {twoFactorEnabled ? t('security.2fa_is_enabled') : t('security.2fa_is_disabled')}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={handleToggle2FA}
                  disabled={verifying2FA}
                />
              </div>

              {!twoFactorEnabled && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    {t('security.recommendation')}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t('security.recommendation_desc')}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="font-medium">{t('security.how_it_works')}</h4>
                <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                  <li>{t('security.step_1')}</li>
                  <li>{t('security.step_2')}</li>
                  <li>{t('security.step_3')}</li>
                  <li>{t('security.step_4')}</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Login History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                {t('security.recent_logins')}
              </CardTitle>
              <CardDescription>
                {t('security.recent_logins_desc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : loginHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {t('security.no_login_history')}
                </p>
              ) : (
                <div className="space-y-4">
                  {loginHistory.map((login) => (
                    <div key={login.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-full">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{login.ip_address || 'Unknown IP'}</p>
                          <p className="text-sm text-muted-foreground">
                            {login.location || 'Unknown Location'} • {login.browser || 'Unknown Browser'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{new Date(login.created_at).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(login.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminPageLayout>
  );
}

export default SecuritySettingsPage;

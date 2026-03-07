
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePermissions } from '@/contexts/PermissionContext';
import { useTenant } from '@/contexts/TenantContext';
import { encodeRouteParam } from '@/lib/routeSecurity';
import useSecureRouteParam from '@/hooks/useSecureRouteParam';
import { useStitchImportConfig } from '@/hooks/useStitchImportConfig';

function ExtensionSettings() {
  const { toast } = useToast();
  const { isPlatformAdmin } = usePermissions();
  const { currentTenant } = useTenant();
  const {
    config: stitchConfig,
    loading: stitchConfigLoading,
    updateConfig: updateStitchConfig,
    refresh: refreshStitchConfig,
  } = useStitchImportConfig();
  const navigate = useNavigate();
  const { id: routeParam } = useParams();
  const { value: extensionId, loading: routeLoading, isLegacy } = useSecureRouteParam(routeParam, 'extensions.settings');
  const [extensions, setExtensions] = useState([]);
  const [selectedExtension, setSelectedExtension] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [stitchSaving, setStitchSaving] = useState(false);
  const [stitchDraft, setStitchDraft] = useState({
    enabled: false,
    mode: 'html',
    max_input_kb: 256,
    allow_raw_html_fallback: true,
  });

  useEffect(() => {
    fetchActiveExtensions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTenant?.id, isPlatformAdmin, extensionId]);

  useEffect(() => {
    if (!routeParam || routeLoading) return;
    if (!extensionId) {
      navigate('/cmspanel/extensions');
      return;
    }
    if (!isLegacy) return;
    const redirectLegacy = async () => {
      const signedId = await encodeRouteParam({ value: extensionId, scope: 'extensions.settings' });
      if (!signedId || signedId === routeParam) return;
      navigate(`/cmspanel/extensions/settings/${signedId}`, { replace: true });
    };
    redirectLegacy();
  }, [routeParam, routeLoading, extensionId, isLegacy, navigate]);

  useEffect(() => {
    setStitchDraft({
      enabled: !!stitchConfig?.enabled,
      mode: stitchConfig?.mode || 'html',
      max_input_kb: Number(stitchConfig?.max_input_kb) || 256,
      allow_raw_html_fallback: stitchConfig?.allow_raw_html_fallback !== false,
    });
  }, [stitchConfig]);

  const fetchActiveExtensions = async () => {
    try {
      let query = supabase
        .from('extensions')
        .select('id, name, config')
        .eq('is_active', true)
        .is('deleted_at', null);

      if (currentTenant?.id) {
        query = query.eq('tenant_id', currentTenant.id);
      } else if (!isPlatformAdmin) {
        query = query.eq('tenant_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      setExtensions(data || []);
      if (data && data.length > 0) {
        const preferred = extensionId ? data.find((ext) => ext.id === extensionId) : null;
        const next = preferred || data[0];
        setSelectedExtension(next.id);
        setSettings(next.config || {});
      }
    } catch (error) {
      console.error('Error fetching extensions:', error);
    }
  };

  const handleExtensionChange = (id) => {
    const ext = extensions.find(e => e.id === id);
    setSelectedExtension(id);
    setSettings(ext?.config || {});
  };

  const handleSave = async () => {
    if (!selectedExtension) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('extensions')
        .update({ config: settings, updated_at: new Date().toISOString() })
        .eq('id', selectedExtension);

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Extension configuration updated successfully."
      });

      // Update local state
      setExtensions(prev => prev.map(e => e.id === selectedExtension ? { ...e, config: settings } : e));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStitchSettings = async () => {
    if (!currentTenant?.id) {
      toast({
        variant: 'destructive',
        title: 'Missing Tenant Context',
        description: 'Stitch import settings are tenant-specific and require an active tenant.',
      });
      return;
    }

    const parsedMaxInputKb = Number(stitchDraft.max_input_kb);
    if (!Number.isFinite(parsedMaxInputKb) || parsedMaxInputKb < 16 || parsedMaxInputKb > 4096) {
      toast({
        variant: 'destructive',
        title: 'Invalid Limit',
        description: 'Max input size must be between 16KB and 4096KB.',
      });
      return;
    }

    setStitchSaving(true);
    try {
      await updateStitchConfig({
        ...stitchDraft,
        max_input_kb: Math.round(parsedMaxInputKb),
      });

      toast({
        title: 'Stitch Settings Saved',
        description: 'Tenant Stitch import configuration updated successfully.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: error.message,
      });
    } finally {
      setStitchSaving(false);
    }
  };

  const handleReloadStitchSettings = async () => {
    try {
      await refreshStitchConfig();
      toast({
        title: 'Refreshed',
        description: 'Latest Stitch import settings loaded.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Refresh Failed',
        description: error.message,
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-card/75">
        <CardHeader>
          <CardTitle>Extension Configuration</CardTitle>
          <CardDescription>Manage individual settings for active extensions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Extension</Label>
            <Select value={selectedExtension || ""} onValueChange={handleExtensionChange}>
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Select extension to configure" />
              </SelectTrigger>
              <SelectContent>
                {extensions.map(ext => (
                  <SelectItem key={ext.id} value={ext.id}>{ext.name}</SelectItem>
                ))}
                {extensions.length === 0 && <SelectItem value="none" disabled>No active extensions</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          {selectedExtension ? (
            <div className="border-t pt-4 space-y-4">
              <div className="rounded-xl border border-border/60 bg-card/65 p-4 font-mono text-sm">
                <div className="flex justify-between items-center mb-2">
                  <Label>Raw Configuration (JSON)</Label>
                  <span className="text-xs text-muted-foreground">Editable</span>
                </div>
                <textarea
                  className="h-64 w-full rounded-lg border border-border/70 bg-background p-2 text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  value={JSON.stringify(settings, null, 2)}
                  onChange={(e) => {
                    try {
                      setSettings(JSON.parse(e.target.value));
                    } catch {
                      // Allow typing, validate on save/blur or show error
                    }
                  }}
                />
              </div>
              <Button onClick={handleSave} disabled={loading} className="rounded-xl bg-primary text-primary-foreground hover:opacity-95">
                {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Configuration
              </Button>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              Select an extension to view its settings.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/75">
        <CardHeader>
          <CardTitle>Stitch Import Settings</CardTitle>
          <CardDescription>Configure tenant-level controls for Stitch import in TipTap and Visual Builder.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!currentTenant?.id ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Stitch settings are available only when a tenant context is active.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card/60 p-4">
                <div className="space-y-1">
                  <Label>Enable Stitch Import</Label>
                  <p className="text-xs text-muted-foreground">Show or hide Stitch import entry points for this tenant.</p>
                </div>
                <Switch
                  checked={!!stitchDraft.enabled}
                  onCheckedChange={(checked) => setStitchDraft((prev) => ({ ...prev, enabled: checked }))}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Import Mode</Label>
                  <Select
                    value={stitchDraft.mode || 'html'}
                    onValueChange={(modeValue) => setStitchDraft((prev) => ({ ...prev, mode: modeValue }))}
                  >
                    <SelectTrigger className="rounded-xl border-border/70 bg-background">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="html">HTML (Sanitized)</SelectItem>
                      <SelectItem value="mapped">Mapped Blocks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stitch_max_input_kb">Max Input Size (KB)</Label>
                  <Input
                    id="stitch_max_input_kb"
                    type="number"
                    min={16}
                    max={4096}
                    className="rounded-xl border-border/70 bg-background"
                    value={stitchDraft.max_input_kb}
                    onChange={(event) => setStitchDraft((prev) => ({
                      ...prev,
                      max_input_kb: event.target.value,
                    }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card/60 p-4">
                <div className="space-y-1">
                  <Label>Allow RawHTML Fallback</Label>
                  <p className="text-xs text-muted-foreground">When enabled, unsupported Stitch structures are stored in sanitized RawHTML blocks.</p>
                </div>
                <Switch
                  checked={!!stitchDraft.allow_raw_html_fallback}
                  onCheckedChange={(checked) => setStitchDraft((prev) => ({ ...prev, allow_raw_html_fallback: checked }))}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReloadStitchSettings}
                  disabled={stitchConfigLoading || stitchSaving}
                  className="rounded-xl border-border/70 bg-background/80 text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${stitchConfigLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveStitchSettings}
                  disabled={stitchConfigLoading || stitchSaving}
                  className="rounded-xl bg-primary text-primary-foreground hover:opacity-95"
                >
                  {stitchSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Stitch Settings
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ExtensionSettings;

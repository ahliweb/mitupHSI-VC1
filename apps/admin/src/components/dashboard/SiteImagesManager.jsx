import { useCallback, useEffect, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { AdminPageLayout, PageHeader } from '@/templates/flowbite-admin';
import { SETTINGS_KEY } from '@/components/dashboard/site-images/constants';
import SiteImagesHeaderActions from '@/components/dashboard/site-images/SiteImagesHeaderActions';
import SiteImagesLoadingState from '@/components/dashboard/site-images/SiteImagesLoadingState';
import SiteImagesTabs from '@/components/dashboard/site-images/SiteImagesTabs';

function SiteImagesManager() {
  const { currentTenant } = useTenant();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('hero');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  const tenantId = currentTenant?.id;

  const loadData = useCallback(async () => {
    if (!tenantId) return;

    setLoading(true);
    try {
      const { data: settings, error } = await supabase
        .from('settings')
        .select('value')
        .eq('tenant_id', tenantId)
        .eq('key', SETTINGS_KEY)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const parsed = settings?.value
        ? (typeof settings.value === 'string' ? JSON.parse(settings.value) : settings.value)
        : {};
      setData(parsed);
    } catch (error) {
      console.error('Error loading site images:', error);
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [tenantId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    if (!tenantId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert(
          {
            tenant_id: tenantId,
            key: SETTINGS_KEY,
            value: JSON.stringify(data),
            type: 'json',
          },
          { onConflict: 'tenant_id,key' }
        );

      if (error) throw error;

      toast({ title: 'Saved', description: 'Site images saved successfully' });
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving:', error);
      toast({ title: 'Error', description: 'Failed to save data', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updateSection = (section, value) => {
    setData((prev) => ({
      ...prev,
      [section]: value,
    }));
    setHasChanges(true);
  };

  if (loading) {
    return <SiteImagesLoadingState />;
  }

  return (
    <AdminPageLayout requiredPermission={['tenant.school_pages.read', 'platform.school_pages.read']}>
      <PageHeader
        title="Site Images"
        description="Manage hero images, section images, and gallery collections"
        icon={ImageIcon}
        breadcrumbs={[{ label: 'Site Images', icon: ImageIcon }]}
        actions={(
          <SiteImagesHeaderActions
            loadData={loadData}
            loading={loading}
            handleSave={handleSave}
            saving={saving}
            hasChanges={hasChanges}
          />
        )}
      />

      <div className="p-6">
        <SiteImagesTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          data={data}
          updateSection={updateSection}
        />
      </div>
    </AdminPageLayout>
  );
}

export default SiteImagesManager;

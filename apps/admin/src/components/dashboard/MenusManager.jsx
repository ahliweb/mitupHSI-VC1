
import { useState, useEffect } from 'react';
import { Plus, Save, RefreshCw, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { usePermissions } from '@/contexts/PermissionContext';
import { useTenant } from '@/contexts/TenantContext';
import { PUBLIC_MODULES } from '@/lib/publicModuleRegistry';
import { AdminPageLayout, PageHeader } from '@/templates/flowbite-admin';
import { SUPPORTED_LOCALES } from '@/lib/i18n';
import MenusOverviewCards from '@/components/dashboard/menus/MenusOverviewCards';
import MenusLocaleSelector from '@/components/dashboard/menus/MenusLocaleSelector';
import MenusLocationSelector from '@/components/dashboard/menus/MenusLocationSelector';
import MenusTreePanel from '@/components/dashboard/menus/MenusTreePanel';
import MenuItemDialog from '@/components/dashboard/menus/MenuItemDialog';
import MenuPermissionsDialog from '@/components/dashboard/menus/MenuPermissionsDialog';
import MenuDeleteDialog from '@/components/dashboard/menus/MenuDeleteDialog';

// Available Menu Locations
const MENU_LOCATIONS = [
  { id: 'header', label: 'Primary Header' },
  { id: 'footer', label: 'Footer' },
  { id: 'public_sidebar', label: 'Public Sidebar' },
  { id: 'mobile_menu', label: 'Mobile Menu' }
];

function MenusManager() {
  const { toast } = useToast();
  const { hasPermission, isPlatformAdmin } = usePermissions();
  const { currentTenant } = useTenant();

  // Data State
  const [menus, setMenus] = useState([]); // This will store the TREE structure
  const [flatMenus, setFlatMenus] = useState([]); // Store flat list for parent selection
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState('header');
  const [currentLocale, setCurrentLocale] = useState(SUPPORTED_LOCALES[0].code);

  // Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [menuFormData, setMenuFormData] = useState({});

  // Permission Editor State
  const [isPermEditorOpen, setIsPermEditorOpen] = useState(false);
  const [selectedMenuPerms, setSelectedMenuPerms] = useState(null);
  const [menuPermissions, setMenuPermissions] = useState({});
  const [menuToDelete, setMenuToDelete] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [selectedModule, setSelectedModule] = useState('');

  const canView = hasPermission('tenant.menu.read');
  const canCreate = hasPermission('tenant.menu.create');
  const canEdit = hasPermission('tenant.menu.update');
  const canDelete = hasPermission('tenant.menu.delete');

  const [pages, setPages] = useState([]);

  useEffect(() => {
    if (canView) {
      fetchMenus();
      fetchRoles();
      fetchPages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, currentLocation, currentLocale, currentTenant?.id]); // Re-fetch when location or tenant changes

  const fetchPages = async () => {
    try {
      let q = supabase.from('pages').select('id, title, slug, status').neq('status', 'archived');
      if (currentTenant?.id) q = q.eq('tenant_id', currentTenant.id);

      const { data, error } = await q;
      if (!error) setPages(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMenus = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('menus')
        .select('*, tenant:tenants(name)')
        .is('deleted_at', null)
        .eq('location', currentLocation)
        .eq('locale', currentLocale)
        .order('order', { ascending: true });

      if (currentTenant?.id) {
        query = query.eq('tenant_id', currentTenant.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      setFlatMenus(data || []);
      const tree = buildMenuTree(data || []);
      setMenus(tree);
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error fetching menus', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const buildMenuTree = (items) => {
    const menuMap = {};
    const roots = [];

    // Initialize map
    items.forEach(item => {
      menuMap[item.id] = { ...item, children: [] };
    });

    // Build hierarchy
    items.forEach(item => {
      if (item.parent_id && menuMap[item.parent_id]) {
        menuMap[item.parent_id].children.push(menuMap[item.id]);
      } else {
        roots.push(menuMap[item.id]);
      }
    });

    // Sort by order
    roots.sort((a, b) => a.order - b.order);
    Object.values(menuMap).forEach(node => {
      node.children.sort((a, b) => a.order - b.order);
    });

    return roots;
  };

  const fetchRoles = async () => {
    if (!currentTenant?.id && !isPlatformAdmin) {
      setRoles([]);
      return;
    }

    let query = supabase
      .from('roles')
      .select('id, name, tenant_id')
      .is('deleted_at', null)
      .order('name');

    if (currentTenant?.id) {
      query = query.eq('tenant_id', currentTenant.id);
    } else {
      query = query.is('tenant_id', null);
    }

    const { data } = await query;
    setRoles(data || []);
  };

  const handleReorder = (newOrder) => {
    setMenus(newOrder);
  };

  const handleChildReorder = (parentId, newChildrenOrder) => {
    const updateRecursive = (items) => {
      return items.map(item => {
        if (item.id === parentId) {
          return { ...item, children: newChildrenOrder };
        }
        if (item.children) {
          return { ...item, children: updateRecursive(item.children) };
        }
        return item;
      });
    };
    setMenus(updateRecursive(menus));
  };

  const saveOrder = async () => {
    try {
      // Flatten the current tree state back into a list of updates
      const updates = [];

      const processNode = (node, index) => {
        updates.push({ id: node.id, order: index });
        if (node.children && node.children.length > 0) {
          node.children.forEach((child, childIndex) => processNode(child, childIndex));
        }
      };

      menus.forEach((menu, index) => processNode(menu, index));

      // Use RPC to avoid 400 errors with partial upserts
      const { error } = await supabase.rpc('update_menu_order', { payload: updates });

      if (error) throw error;

      toast({ title: 'Menu order saved', description: 'The navigation structure has been updated.' });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Failed to save order', description: err.message });
    }
  };

  const handleEdit = (menu) => {
    setEditingMenu(menu);
    setSelectedModule('');
    if (menu) {
      // Ensure boolean values are properly set when editing existing menu
      setMenuFormData({
        ...menu,
        is_active: menu.is_active === true,
        is_public: menu.is_public === true,
        page_id: menu.page_id || '', // Handle page_id
        location: menu.location || currentLocation,
        locale: menu.locale || currentLocale
      });
    } else {
      // Default values for new menu
      setMenuFormData({
        label: '',
        url: '',
        name: '',
        is_public: true,
        is_active: true,
        parent_id: null,
        page_id: '',
        location: currentLocation,
        locale: currentLocale
      });
    }
    setIsEditing(true);
  };

  // Handle Page Selection
  const handlePageSelect = (pageId) => {
    const page = pages.find(p => p.id === pageId);
    if (page) {
      setMenuFormData(prev => ({
        ...prev,
        page_id: pageId,
        url: page.slug.startsWith('/') ? page.slug : `/${page.slug}`, // Auto-set URL
        label: prev.label || page.title // Auto-set label if empty
      }));
    } else {
      // Clear page association
      setMenuFormData(prev => ({ ...prev, page_id: null }));
    }
  };

  const handleSaveMenu = async (e) => {
    e.preventDefault();

    const payload = {
      label: menuFormData.label,
      name: menuFormData.name || menuFormData.label.toLowerCase().replace(/[^a-z0-9_]+/g, '_'),
      url: menuFormData.url,
      parent_id: menuFormData.parent_id || null,
      page_id: menuFormData.page_id || null,
      location: menuFormData.location || currentLocation,
      locale: currentLocale,
      is_public: menuFormData.is_public,
      is_active: menuFormData.is_active,
      updated_at: new Date().toISOString()
    };

    try {
      let error;
      if (editingMenu) {
        const { error: updateError } = await supabase
          .from('menus')
          .update(payload)
          .eq('id', editingMenu.id);
        error = updateError;
      } else {
        // Get max order for new item
        payload.order = 99; // Default to end, user can reorder
        payload.tenant_id = currentTenant?.id; // Set tenant context
        const { error: insertError } = await supabase
          .from('menus')
          .insert(payload);
        error = insertError;
      }

      if (error) throw error;

      toast({ title: 'Success', description: 'Menu item saved successfully' });
      setIsEditing(false);
      fetchMenus();
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error saving menu', description: err.message });
    }
  };

  const requestDelete = (menu) => {
    setMenuToDelete(menu);
  };

  const handleConfirmDelete = async () => {
    if (!menuToDelete) {
      return;
    }

    const { error } = await supabase
      .from('menus')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', menuToDelete.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error deleting menu' });
    } else {
      toast({ title: 'Menu deleted' });
      fetchMenus();
    }

    setMenuToDelete(null);
  };

  const openPermissions = async (menu) => {
    setSelectedMenuPerms(menu);
    // Fetch existing perms
    const { data } = await supabase
      .from('menu_permissions')
      .select('role_id, can_view')
      .eq('menu_id', menu.id);

    const permsMap = {};
    roles.forEach(r => permsMap[r.id] = false); // Default false

    if (data) {
      data.forEach(p => {
        if (p.can_view) permsMap[p.role_id] = true;
      });
    }
    setMenuPermissions(permsMap);
    setIsPermEditorOpen(true);
  };

  const savePermissions = async () => {
    const upserts = Object.entries(menuPermissions).map(([roleId, canView]) => ({
      menu_id: selectedMenuPerms.id,
      role_id: roleId,
      can_view: canView,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('menu_permissions')
      .upsert(upserts, { onConflict: 'menu_id, role_id' });

    if (error) {
      toast({ variant: 'destructive', title: 'Failed to save permissions' });
    } else {
      toast({ title: 'Permissions updated' });
      setIsPermEditorOpen(false);
    }
  };

  // Sync from public module registry
  const syncFromModules = async () => {
    if (!currentTenant?.id) {
      toast({ variant: 'destructive', title: 'No tenant selected' });
      return;
    }
    setSyncing(true);
    try {
      const existingUrls = new Set(flatMenus.map(m => m.url));
      const modulesToAdd = PUBLIC_MODULES.filter(mod => !existingUrls.has(mod.url));

      if (modulesToAdd.length === 0) {
        toast({ title: 'All modules already exist', description: 'No new items to add' });
        setSyncing(false);
        return;
      }

      const maxOrder = Math.max(0, ...flatMenus.map(m => m.order || 0));
      const newItems = modulesToAdd.map((mod, idx) => ({
        label: mod.label,
        name: mod.key,
        url: mod.url,
        icon: mod.icon,
        location: currentLocation,
        parent_id: null,
        order: maxOrder + ((idx + 1) * 10),
        is_active: true,
        is_public: true,
        tenant_id: currentTenant.id,
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from('menus').insert(newItems);
      if (error) throw error;

      toast({ title: 'Sync complete', description: `Added ${newItems.length} menu items` });
      fetchMenus();
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Sync failed', description: err.message });
    } finally {
      setSyncing(false);
    }
  };

  // Handle module picker selection
  const handleModuleSelect = (moduleKey) => {
    setSelectedModule(moduleKey);
    if (moduleKey) {
      const mod = PUBLIC_MODULES.find(m => m.key === moduleKey);
      if (mod) {
        setMenuFormData(prev => ({
          ...prev,
          label: mod.label,
          name: mod.key,
          url: mod.url,
        }));
      }
    }
  };

  if (!canView) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-border/60 bg-card/70 p-8 text-center text-muted-foreground shadow-sm">
        Access Denied
      </div>
    );
  }

  return (
    <AdminPageLayout requiredPermission="tenant.menu.read">
      <PageHeader
        title="Menu Management"
        description="Configure public navigation structure for headers, footers, and sidebars"
        icon={Menu}
        breadcrumbs={[{ label: 'Menus', icon: Menu }]}
        actions={(
          <div className="flex gap-3 flex-wrap">
            {canCreate && (
              <Button onClick={syncFromModules} variant="outline" disabled={syncing} className="h-10 rounded-xl border-border/70 bg-background/80 px-3 text-muted-foreground shadow-sm hover:bg-accent/70 hover:text-foreground">
                <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} /> Sync Modules
              </Button>
            )}
            <Button onClick={saveOrder} variant="outline" className="h-10 rounded-xl border-border/70 bg-background/80 px-3 text-muted-foreground shadow-sm hover:bg-accent/70 hover:text-foreground">
              <Save className="w-4 h-4 mr-2" /> Save Order
            </Button>
            {canCreate && (
              <Button onClick={() => handleEdit(null)} className="h-10 rounded-xl bg-primary px-4 text-primary-foreground shadow-sm hover:opacity-95">
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
            )}
          </div>
        )}
      />

      <div className="space-y-6">
        <MenusOverviewCards
          flatMenus={flatMenus}
          rolesCount={roles.length}
          currentLocationLabel={MENU_LOCATIONS.find((location) => location.id === currentLocation)?.label}
        />

        <MenusLocaleSelector
          locales={SUPPORTED_LOCALES}
          currentLocale={currentLocale}
          onChangeLocale={setCurrentLocale}
        />

        <MenusLocationSelector
          locations={MENU_LOCATIONS}
          currentLocation={currentLocation}
          onChangeLocation={setCurrentLocation}
        />

        <MenusTreePanel
          loading={loading}
          menus={menus}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={handleEdit}
          onRequestDelete={requestDelete}
          onPerms={openPermissions}
          onReorder={handleReorder}
          onChildReorder={handleChildReorder}
          isPlatformAdmin={isPlatformAdmin}
        />

        <MenuItemDialog
          open={isEditing}
          onOpenChange={setIsEditing}
          editingMenu={editingMenu}
          currentLocation={currentLocation}
          menuLocations={MENU_LOCATIONS}
          menuFormData={menuFormData}
          setMenuFormData={setMenuFormData}
          selectedModule={selectedModule}
          onModuleSelect={handleModuleSelect}
          pages={pages}
          onPageSelect={handlePageSelect}
          flatMenus={flatMenus}
          onSave={handleSaveMenu}
        />

        <MenuPermissionsDialog
          open={isPermEditorOpen}
          onOpenChange={setIsPermEditorOpen}
          selectedMenu={selectedMenuPerms}
          roles={roles}
          menuPermissions={menuPermissions}
          setMenuPermissions={setMenuPermissions}
          onSave={savePermissions}
        />

        <MenuDeleteDialog
          open={Boolean(menuToDelete)}
          onOpenChange={(open) => !open && setMenuToDelete(null)}
          menu={menuToDelete}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </AdminPageLayout>
  );
}

export default MenusManager;

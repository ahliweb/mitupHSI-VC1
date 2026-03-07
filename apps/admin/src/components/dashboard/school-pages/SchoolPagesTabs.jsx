import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SCHOOL_PAGE_TABS } from '@/components/dashboard/school-pages/constants';
import ProfileEditor from '@/components/dashboard/school-pages/ProfileEditor';
import OrganizationEditor from '@/components/dashboard/school-pages/OrganizationEditor';
import StaffEditor from '@/components/dashboard/school-pages/StaffEditor';
import ServicesEditor from '@/components/dashboard/school-pages/ServicesEditor';
import AchievementsEditor from '@/components/dashboard/school-pages/AchievementsEditor';
import AlumniEditor from '@/components/dashboard/school-pages/AlumniEditor';
import FinanceEditor from '@/components/dashboard/school-pages/FinanceEditor';
import GalleryEditor from '@/components/dashboard/school-pages/GalleryEditor';
import AgendaEditor from '@/components/dashboard/school-pages/AgendaEditor';
import ContactEditor from '@/components/dashboard/school-pages/ContactEditor';

const EDITORS = {
  profile: ProfileEditor,
  organization: OrganizationEditor,
  staff: StaffEditor,
  services: ServicesEditor,
  achievements: AchievementsEditor,
  alumni: AlumniEditor,
  finance: FinanceEditor,
  gallery: GalleryEditor,
  agenda: AgendaEditor,
  contact: ContactEditor,
};

function SchoolPagesTabs({
  activeTab,
  navigate,
  data,
  updateField,
  updateTopLevel,
}) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        navigate(value === 'profile' ? '/cmspanel/school-pages' : `/cmspanel/school-pages/${value}`);
      }}
    >
      <TabsList className="grid h-auto grid-cols-5 gap-1 p-1 lg:grid-cols-10">
        {SCHOOL_PAGE_TABS.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="flex flex-col items-center gap-1 px-3 py-2 text-xs"
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {SCHOOL_PAGE_TABS.map((tab) => {
        const EditorComponent = EDITORS[tab.id];
        return (
          <TabsContent key={tab.id} value={tab.id} className="mt-6 space-y-6">
            <EditorComponent
              data={data[tab.id]}
              updateField={updateField}
              updateTopLevel={updateTopLevel}
            />
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

export default SchoolPagesTabs;

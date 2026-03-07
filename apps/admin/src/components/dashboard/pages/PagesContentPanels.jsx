import GenericContentManager from '@/components/dashboard/GenericContentManager';
import { PageTabs, TabsContent } from '@/templates/flowbite-admin';

function PagesContentPanels({
	onlyVisual,
	activeTab,
	tabs,
	navigate,
	t,
	pageColumns,
	pageFormFields,
	selectedLanguage,
	customRowActions,
	renderLanguageToolbar,
	categoryColumns,
	categoryFormFields,
	tagColumns,
	tagFormFields,
}) {
	if (onlyVisual) {
		return (
			<GenericContentManager
				tableName="pages"
				resourceName={t('pages.visual_title')}
				columns={pageColumns}
				formFields={pageFormFields}
				permissionPrefix="visual_pages"
				customRowActions={customRowActions}
				defaultFilters={{ editor_type: 'visual', locale: selectedLanguage }}
				showBreadcrumbs={false}
				customToolbarActions={renderLanguageToolbar}
			/>
		);
	}

	return (
		<PageTabs
			value={activeTab}
			onValueChange={(value) => {
				navigate(value === 'pages' ? '/cmspanel/pages' : `/cmspanel/pages/${value}`);
			}}
			tabs={tabs}
		>
			<TabsContent value="pages" className="mt-0">
				<GenericContentManager
					tableName="pages"
					resourceName={t('pages.badges.regular')}
					columns={pageColumns}
					formFields={pageFormFields}
					permissionPrefix="pages"
					defaultFilters={{ page_type: 'regular', locale: selectedLanguage }}
					customSelect="*, category:categories!pages_category_id_fkey(id, name), owner:users!created_by(email, full_name), tenant:tenants(name)"
					customRowActions={customRowActions}
					showBreadcrumbs={false}
					customToolbarActions={renderLanguageToolbar}
				/>
			</TabsContent>

			<TabsContent value="categories" className="mt-0">
				<GenericContentManager
					tableName="categories"
					resourceName={t('pages.category.form.type_page')}
					columns={categoryColumns}
					formFields={categoryFormFields}
					permissionPrefix="categories"
					customSelect="*, owner:users!created_by(email, full_name), tenant:tenants(name)"
					defaultFilters={{ type: 'page' }}
					showBreadcrumbs={false}
				/>
			</TabsContent>

			<TabsContent value="tags" className="mt-0">
				<GenericContentManager
					tableName="tags"
					resourceName={t('pages.tags.singular') || 'Tag'}
					columns={tagColumns}
					formFields={tagFormFields}
					permissionPrefix="tags"
					customSelect="*, owner:users!created_by(email, full_name), tenant:tenants(name)"
					showBreadcrumbs={false}
				/>
			</TabsContent>
		</PageTabs>
	);
}

export default PagesContentPanels;

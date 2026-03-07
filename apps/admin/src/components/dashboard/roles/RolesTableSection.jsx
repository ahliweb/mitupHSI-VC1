import ContentTable from '@/components/dashboard/ContentTable';

function RolesTableSection({
	data,
	columns,
	loading,
	canEdit,
	canDelete,
	onEdit,
	onDelete,
}) {
	return (
		<ContentTable
			data={data}
			columns={columns}
			loading={loading}
			onEdit={canEdit ? onEdit : null}
			onDelete={canDelete ? onDelete : null}
		/>
	);
}

export default RolesTableSection;

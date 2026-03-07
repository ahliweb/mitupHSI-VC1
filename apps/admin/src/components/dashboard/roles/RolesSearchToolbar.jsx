import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MinCharSearchInput from '@/components/common/MinCharSearchInput';
import { cn } from '@/lib/utils';

function RolesSearchToolbar({
	t,
	query,
	setQuery,
	clearSearch,
	loading,
	searchLoading,
	isSearchValid,
	searchMessage,
	minLength,
	totalRoles,
	visibleRoles,
	searchActive,
	onRefresh,
}) {
	return (
		<div className="border-b border-border/60 bg-card/75 p-4 backdrop-blur-sm">
			<div className="grid gap-3 lg:grid-cols-[minmax(260px,420px)_1fr_auto] lg:items-center">
				<div className="max-w-xl">
					<MinCharSearchInput
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						onClear={clearSearch}
						loading={loading || searchLoading}
						isValid={isSearchValid}
						message={searchMessage}
						minLength={minLength}
						placeholder={t('common.search_resource', { resource: t('roles.title') })}
					/>
				</div>

				<div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
					<span className="inline-flex items-center rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-muted-foreground">
						{t('common.total', 'Total')}: <span className="ml-1 font-semibold text-foreground">{totalRoles}</span>
					</span>
					<span className="inline-flex items-center rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-muted-foreground">
						{t('common.visible', 'Visible')}: <span className="ml-1 font-semibold text-foreground">{visibleRoles}</span>
					</span>
					{searchActive ? (
						<Button
							variant="ghost"
							size="sm"
							onClick={clearSearch}
							className="h-8 rounded-full border border-border/70 px-3 text-muted-foreground hover:bg-accent/60 hover:text-foreground"
						>
							{t('common.clear', 'Clear')}
						</Button>
					) : null}
				</div>

				<Button
					variant="outline"
					onClick={onRefresh}
					title={t('common.refresh')}
					disabled={loading}
					className="h-10 rounded-xl border-border/70 bg-background/75 px-3 text-muted-foreground hover:bg-accent/70 hover:text-foreground disabled:opacity-60"
				>
					<RefreshCw className={cn('mr-1.5 h-4 w-4', loading && 'animate-spin')} />
					{t('common.refresh')}
				</Button>
			</div>
		</div>
	);
}

export default RolesSearchToolbar;

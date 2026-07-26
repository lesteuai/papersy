<script lang="ts">
	import type { Session } from '$lib/utils/types';
	import RenameDialog from '$lib/components/dedicated/app/RenameDialog.svelte';

	let {
		sessions,
		selectedId = null,
		onCreate,
		onSelect,
		onRename,
		onDelete
	}: {
		sessions: Session[];
		selectedId?: string | null;
		onCreate: () => void;
		onSelect: (id: string) => void;
		onRename: (id: string, name: string) => void;
		onDelete: (id: string) => void;
	} = $props();

	let openMenuId = $state<string | null>(null);
	let renamingSession = $state<Session | null>(null);

	function handleToggleMenu(e: MouseEvent, id: string) {
		e.stopPropagation();
		openMenuId = openMenuId === id ? null : id;
	}

	function handleRenameRequest(e: MouseEvent, session: Session) {
		e.stopPropagation();
		openMenuId = null;
		renamingSession = session;
	}

	function handleDelete(e: MouseEvent, id: string) {
		e.stopPropagation();
		openMenuId = null;
		onDelete(id);
	}

	function handleRenameSubmit(name: string) {
		if (renamingSession) onRename(renamingSession.id, name);
		renamingSession = null;
	}

	function handleRenameCancel() {
		renamingSession = null;
	}

	function handleWindowClick() {
		openMenuId = null;
	}
</script>

<svelte:window onclick={handleWindowClick} />

<div class="session-list">
	<div class="header">
		<button class="new-btn" onclick={onCreate} aria-label="New chat">New chat</button>
	</div>
	<div class="list">
		{#each sessions as session (session.id)}
			<div class="session-item" class:selected={session.id === selectedId}>
				<button class="session-name" onclick={() => onSelect(session.id)}>
					{session.label}
				</button>
				<div class="menu-wrapper">
					<button
						class="menu-toggle"
						onclick={(e) => handleToggleMenu(e, session.id)}
						aria-label="Session actions"
					>
						&hellip;
					</button>
					{#if openMenuId === session.id}
						<div class="menu">
							<button class="menu-item" onclick={(e) => handleRenameRequest(e, session)}>
								Rename
							</button>
							<button class="menu-item danger" onclick={(e) => handleDelete(e, session.id)}>
								Delete
							</button>
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>

<RenameDialog
	open={renamingSession !== null}
	currentValue={renamingSession?.label ?? ''}
	title="Rename chat"
	onSubmit={handleRenameSubmit}
	onCancel={handleRenameCancel}
/>

<style lang="scss">
	.session-list {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.1);
	}

	.new-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		padding: 10px 14px;
		border: none;
		border-radius: 8px;
		background-color: var(--color--primary);
		color: var(--color--primary-contrast);
		font: inherit;
		font-size: 0.9rem;
		cursor: pointer;
		transition: opacity 0.2s;

		&:hover {
			opacity: 0.85;
		}
	}

	.list {
		flex: 1;
		overflow-y: auto;
		padding: 4px 8px 16px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.session-item {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 2px 8px;
		border-radius: 8px;
		transition: background-color 0.2s;

		&:hover {
			background-color: rgba(var(--color--text-rgb), 0.05);

			.menu-toggle {
				opacity: 1;
			}
		}

		&.selected {
			background-color: rgba(var(--color--primary-rgb), 0.1);
		}
	}

	.session-name {
		flex: 1;
		text-align: left;
		background: none;
		border: none;
		padding: 10px 4px;
		font: inherit;
		color: var(--color--text);
		cursor: pointer;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.menu-wrapper {
		position: relative;
	}

	.menu-toggle {
		background: none;
		border: none;
		color: var(--color--text-shade);
		cursor: pointer;
		padding: 6px 8px;
		font-size: 1rem;
		line-height: 1;
		opacity: 0;
		transition: opacity 0.2s;

		&:focus-visible {
			opacity: 1;
			outline: none;
		}
	}

	.menu {
		position: absolute;
		right: 0;
		top: 100%;
		z-index: 10;
		background: var(--color--card-background);
		border: 1px solid rgba(var(--color--text-rgb), 0.1);
		border-radius: 8px;
		box-shadow: var(--card-shadow);
		min-width: 120px;
		display: flex;
		flex-direction: column;
		padding: 4px;
	}

	.menu-item {
		background: none;
		border: none;
		text-align: left;
		padding: 8px 10px;
		font: inherit;
		font-size: 0.875rem;
		color: var(--color--text);
		cursor: pointer;
		border-radius: 6px;

		&:hover {
			background-color: rgba(var(--color--text-rgb), 0.08);
		}

		&.danger {
			color: #e53e3e;
		}
	}
</style>

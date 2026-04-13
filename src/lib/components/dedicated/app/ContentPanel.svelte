<script lang="ts">
	import ArrowLeftIcon from '$lib/icons/arrow-left.svelte';
	import SummaryView from './SummaryView.svelte';
	import ChatView from './ChatView.svelte';
	import ChatInput from './ChatInput.svelte';
	import type { ChatMessage, Mode } from './types';

	type SummaryData = {
		summary: string;
		keyFindings: string[];
		methodology: string;
		limitations: string;
		references: string[];
	};

	let {
		mode,
		messages,
		summaryData,
		onBack,
		onModeChange,
		onSend,
		disabled = false
	}: {
		mode: Mode;
		messages: ChatMessage[];
		summaryData: SummaryData | null;
		onBack: () => void;
		onModeChange: (m: Mode) => void;
		onSend: (text: string) => void;
		disabled?: boolean;
	} = $props();
</script>

<div class="content-panel">
	<div class="panel-header">
		<button class="back-btn" onclick={onBack} aria-label="Go back">
			<ArrowLeftIcon />
		</button>
		<div class="tabs">
			<button
				class="tab"
				class:active={mode === 'summary'}
				class:disabled
				onclick={() => onModeChange('summary')}
				{disabled}
			>
				Summary
			</button>
			<button
				class="tab"
				class:active={mode === 'chat'}
				class:disabled
				onclick={() => onModeChange('chat')}
				{disabled}
			>
				Chat
			</button>
		</div>
	</div>

	<div class="panel-body">
		{#if mode === 'summary'}
			<SummaryView data={summaryData} />
		{:else}
			<ChatView {messages} />
		{/if}
	</div>

	<ChatInput
		onSend={onSend}
		{disabled}
	/>
</div>

<style lang="scss">
	.content-panel {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.panel-header {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 12px;
		border-bottom: 1px solid rgba(var(--color--text-rgb), 0.1);
		flex-shrink: 0;
	}

	.back-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--color--text);
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		padding: 4px;
		flex-shrink: 0;

		&:hover {
			background-color: rgba(var(--color--text-rgb), 0.08);
		}
	}

	.tabs {
		display: flex;
		gap: 4px;
	}

	.tab {
		background: none;
		border: none;
		cursor: pointer;
		font: inherit;
		font-size: 0.9rem;
		color: var(--color--text-shade);
		padding: 6px 14px;
		border-radius: 6px;
		transition: all 0.15s;

		&:hover {
			color: var(--color--text);
			background-color: rgba(var(--color--text-rgb), 0.06);
		}

		&.active {
			color: var(--color--primary);
			background-color: rgba(var(--color--primary-rgb), 0.1);
			font-weight: 600;
		}

		&:disabled,
		&.disabled {
			opacity: 0.5;
			cursor: not-allowed;
			pointer-events: none;
		}
	}

	.panel-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
</style>

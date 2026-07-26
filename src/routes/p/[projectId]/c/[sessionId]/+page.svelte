<script lang="ts">
	import { page } from '$app/state';
	import { getContext } from 'svelte';
	import ChatView from '$lib/components/dedicated/app/ChatView.svelte';
	import type { ChatMessage } from '$lib/utils/types';

	const refreshSessions = getContext<() => Promise<void>>('refreshSessions');

	const sessionId = $derived(page.params.sessionId!);

	let messages = $state<ChatMessage[]>([]);

	async function getMessages() {
		const res = await fetch(`/api/sessions/${sessionId}/messages`);
		if (!res.ok) return;
		messages = await res.json();
	}

	async function handleSend(text: string) {
		const isFirstMessage = messages.length === 0;
		messages = [...messages, { role: 'user', text }, { role: 'assistant', text: '', loading: true }];

		const res = await fetch('/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ sessionId, text })
		});

		if (!res.ok) {
			const body = await res.json().catch(() => null);
			const errorText = body?.message ?? 'Something went wrong. Please try again.';
			messages = messages.map((message, idx) =>
				idx === messages.length - 1 ? { role: 'assistant', text: errorText } : message
			);
			return;
		}

		const { text: replyText } = await res.json();
		messages = messages.map((message, idx) =>
			idx === messages.length - 1 ? { role: 'assistant', text: replyText } : message
		);

		if (isFirstMessage) await refreshSessions();
	}

	$effect(() => {
		// re-fetch history whenever the session route param changes, so switching
		// between two sessions in the same project doesn't leave stale messages
		sessionId;
		getMessages();
	});
</script>

<ChatView {messages} onSend={handleSend} />

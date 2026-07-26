<script lang="ts">
	import { page } from '$app/state';
	import { getContext } from 'svelte';
	import ChatView from '$lib/components/dedicated/app/ChatView.svelte';
	import type { ChatMessage } from '$lib/utils/types';

	const refreshSessions = getContext<() => Promise<void>>('refreshSessions');

	const sessionId = $derived(page.params.sessionId!);

	let messages = $state<ChatMessage[]>([]);

	// Bumped by every history load and by every send. A load whose token is stale by the
	// time it resolves is dropped, so a slow fetch for a session that was still empty
	// cannot overwrite messages the user has since sent.
	let loadToken = 0;

	async function getMessages() {
		const token = ++loadToken;
		const requestedSessionId = sessionId;
		const res = await fetch(`/api/sessions/${requestedSessionId}/messages`);
		if (!res.ok) return;
		const loaded = await res.json();
		if (token !== loadToken || requestedSessionId !== sessionId) return;
		messages = loaded;
	}

	async function handleSend(text: string) {
		loadToken++;
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

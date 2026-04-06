import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import type { RequestEvent } from '@sveltejs/kit';

function handler(event: RequestEvent) {
	return svelteKitHandler({ auth, event, resolve: () => new Response('Not Found', { status: 404 }), building });
}

export const GET = handler;
export const POST = handler;

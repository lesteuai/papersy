import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { client } from '$lib/server/db';
import type { Handle } from '@sveltejs/kit';

// Close the postgres connection pool on shutdown so the process can exit cleanly.
// Without this, idle DB connections keep the event loop alive and the process
// hangs on Ctrl+C or SIGTERM, requiring SIGKILL to stop.
// Skipped during build time since there is no running server to shut down.
if (!building) {
	const shutdown = async () => {
		await client.end();
		process.exit(0);
	};
	process.once('SIGINT', shutdown);
	process.once('SIGTERM', shutdown);
}

export const handle: Handle = ({ event, resolve }) => {
	return svelteKitHandler({ auth, event, resolve, building });
};

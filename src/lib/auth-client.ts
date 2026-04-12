import { browser } from '$app/environment';
import { createAuthClient } from 'better-auth/svelte';

let authClient: ReturnType<typeof createAuthClient> | null = null;

export function getAuthClient() {
	if (browser && !authClient) {
		authClient = createAuthClient();
	}
	return authClient;
}

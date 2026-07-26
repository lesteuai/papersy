import { loggedIn } from '$lib/stores/auth';
import type { LayoutLoad } from './$types';

export const ssr = false;

// Syncs the store before the first render, so the logged out UI never paints for a user who
// already has a session. Assigning the value rather than only setting true also lets a load
// that reports no session clear a stale true. Touching a module-level store from a load would
// leak between requests under SSR, which is safe here only because ssr is false above.
export const load: LayoutLoad = async ({ data }) => {
	loggedIn.set(data.loggedIn);
	return data;
};

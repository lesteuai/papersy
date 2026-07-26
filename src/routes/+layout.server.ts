import { auth } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';

// Runs for every route, so a refresh anywhere restores the session, not just on the project list.
export const load: LayoutServerLoad = async ({ request }) => {
	// Without this guard a database or auth outage renders the error page instead of the login
	// form, which is worse than the pre-load behaviour of always showing the login form.
	try {
		const session = await auth.api.getSession({ headers: request.headers });
		return { loggedIn: session !== null };
	} catch (err) {
		console.error('Session lookup failed:', err instanceof Error ? err.message : err);
		return { loggedIn: false };
	}
};

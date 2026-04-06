import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/auth.schema';

const MAX_USERS = 100;

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	emailAndPassword: {
		enabled: true,
		async beforeSignUp(user) {
			const count = await db.select({ count: db.count() }).from(userTable);
			if (count[0].count >= MAX_USERS) {
				return {
					error: {
						code: 'USER_LIMIT_REACHED',
						message: 'Sign-ups are currently closed (user limit reached)',
					},
				};
			}
		},
	},
	plugins: [
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});

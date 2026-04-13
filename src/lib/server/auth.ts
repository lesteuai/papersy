import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { count } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/auth.schema';

const MAX_USERS = 100;

async function sendVerificationEmail(data: { user: { email: string; name: string }; url: string }) {
	// TODO: Implement email sending (e.g., via Resend, SendGrid, Nodemailer)
	// For now, log the verification URL
	console.log(`[EMAIL] Verification link for ${data.user.email}: ${data.url}`);
}

async function sendResetPassword(data: { user: { email: string; name: string }; url: string; token: string }) {
	// TODO: Implement email sending (e.g., via Resend, SendGrid, Nodemailer)
	// For now, log the reset URL
	console.log(`[EMAIL] Password reset link for ${data.user.email}: ${data.url}`);
}

console.log('[AUTH] ORIGIN:', env.ORIGIN, '| process.env.ORIGIN:', process.env.ORIGIN);

export const auth = betterAuth({
	baseURL: env.ORIGIN || process.env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		async beforeSignUp() {
			const result = await db.select({ count: count() }).from(userTable);
			if (result[0].count >= MAX_USERS) {
				return {
					error: {
						code: 'USER_LIMIT_REACHED',
						message: 'Sign-ups are currently closed (user limit reached)',
					},
				};
			}
		},
		sendResetPassword,
		onPasswordReset: async ({ user }) => {
			console.log(`[AUTH] Password reset completed for ${user.email}`);
		},
	},
	emailVerification: {
		sendVerificationEmail,
	},
	plugins: [
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});

export async function requireSession(headers: Headers) {
	const session = await auth.api.getSession({ headers });
	if (!session) error(401, 'Unauthorized');
	return session;
}

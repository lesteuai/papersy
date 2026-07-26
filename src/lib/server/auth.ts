import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';

async function sendResetPassword(data: { user: { email: string; name: string }; url: string; token: string }) {
	// TODO: Implement email sending (e.g., via Resend, SendGrid, Nodemailer)
	// For now, log the reset URL
	console.log(`[EMAIL] Password reset link for ${data.user.email}: ${data.url}`);
}

const origin = process.env.NODE_ENV === 'production'
	? env.ORIGIN
	: (env.ORIGIN_DEV ?? env.ORIGIN);

export const auth = betterAuth({
	baseURL: origin,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
		sendResetPassword,
		onPasswordReset: async ({ user }) => {
			console.log(`[AUTH] Password reset completed for ${user.email}`);
		},
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

import { defineConfig } from 'drizzle-kit';

if (!process.env.PG_USER || !process.env.PG_PASSWORD || !process.env.PG_HOST || !process.env.PG_PORT || !process.env.PG_DATABASE) {
	throw new Error('Missing required PostgreSQL environment variables: PG_USER, PG_PASSWORD, PG_HOST, PG_PORT, PG_DATABASE');
}

const dbUrl = `postgresql://${process.env.PG_USER}:${process.env.PG_PASSWORD}@${process.env.PG_HOST}:${process.env.PG_PORT}/${process.env.PG_DATABASE}`;

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: 'postgresql',
	dbCredentials: { url: dbUrl },
	verbose: true,
	strict: true
});

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

if (!env.PG_USER || !env.PG_PASSWORD || !env.PG_HOST || !env.PG_PORT || !env.PG_DATABASE) {
	throw new Error('Missing required PostgreSQL environment variables: PG_USER, PG_PASSWORD, PG_HOST, PG_PORT, PG_DATABASE');
}

// sslmode=require is mandatory for the managed Postgres host; without it postgres-js refuses the connection
const dbUrl = `postgresql://${env.PG_USER}:${env.PG_PASSWORD}@${env.PG_HOST}:${env.PG_PORT}/${env.PG_DATABASE}?${env.PG_SSL === 'true' ? 'channel_binding=require&sslmode=require' : '' }`;

export const client = postgres(dbUrl);

export const db = drizzle(client, { schema });

import { SQL, sql, relations } from 'drizzle-orm';
import { customType, index, integer, pgTable, text, timestamp, vector } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';
import { JobStatus } from '$lib/utils/types';

export const tsvector = customType<{ data: string }>({
	dataType() {
		return 'tsvector';
	}
});

export const project = pgTable(
	'project',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		createdAt: timestamp('created_at').defaultNow()
	},
	(t) => [index('project_user_id_idx').on(t.userId)]
);

export const chatSession = pgTable(
	'chat_session',
	{
		id: text('id').primaryKey(),
		projectId: text('project_id')
			.notNull()
			.references(() => project.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		// NULL means not named by the user; label is derived from the first user message at read time.
		name: text('name'),
		createdAt: timestamp('created_at').defaultNow()
	},
	(t) => [index('chat_session_project_id_idx').on(t.projectId)]
);

export const chatMessage = pgTable(
	'chat_message',
	{
		id: text('id').primaryKey(),
		sessionId: text('session_id')
			.notNull()
			.references(() => chatSession.id, { onDelete: 'cascade' }),
		role: text('role').notNull(),
		content: text('content').notNull(),
		createdAt: timestamp('created_at').defaultNow()
	},
	(t) => [index('chat_message_session_id_idx').on(t.sessionId)]
);

export const document = pgTable(
	'document',
	{
		id: text('id').primaryKey(),
		projectId: text('project_id')
			.notNull()
			.references(() => project.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		kind: text('kind').notNull(),
		charCount: integer('char_count'),
		status: text('status').notNull().default(JobStatus.Pending),
		error: text('error'),
		createdAt: timestamp('created_at').defaultNow()
	},
	(t) => [index('document_project_id_idx').on(t.projectId)]
);

export const documentChunk = pgTable(
	'document_chunk',
	{
		id: text('id').primaryKey(),
		documentId: text('document_id')
			.notNull()
			.references(() => document.id, { onDelete: 'cascade' }),
		// Denormalized so retrieval can filter without a join.
		projectId: text('project_id').notNull(),
		userId: text('user_id').notNull(),
		content: text('content').notNull(),
		chunkIndex: integer('chunk_index').notNull(),
		embedding: vector('embedding', { dimensions: 1536 }),
		tsv: tsvector('tsv').generatedAlwaysAs(
			(): SQL => sql`to_tsvector('english', ${documentChunk.content})`
		)
	},
	(t) => [
		index('document_chunk_project_id_idx').on(t.projectId),
		index('document_chunk_tsv_idx').using('gin', t.tsv),
		index('document_chunk_embedding_idx').using('hnsw', t.embedding.op('vector_cosine_ops'))
	]
);

export const projectRelations = relations(project, ({ one, many }) => ({
	user: one(user, {
		fields: [project.userId],
		references: [user.id]
	}),
	chatSessions: many(chatSession),
	documents: many(document)
}));

export const chatSessionRelations = relations(chatSession, ({ one, many }) => ({
	project: one(project, {
		fields: [chatSession.projectId],
		references: [project.id]
	}),
	user: one(user, {
		fields: [chatSession.userId],
		references: [user.id]
	}),
	messages: many(chatMessage)
}));

export const chatMessageRelations = relations(chatMessage, ({ one }) => ({
	session: one(chatSession, {
		fields: [chatMessage.sessionId],
		references: [chatSession.id]
	})
}));

export const documentRelations = relations(document, ({ one, many }) => ({
	project: one(project, {
		fields: [document.projectId],
		references: [project.id]
	}),
	user: one(user, {
		fields: [document.userId],
		references: [user.id]
	}),
	chunks: many(documentChunk)
}));

export const documentChunkRelations = relations(documentChunk, ({ one }) => ({
	document: one(document, {
		fields: [documentChunk.documentId],
		references: [document.id]
	})
}));

export * from './auth.schema';

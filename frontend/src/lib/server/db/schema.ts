import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './auth.schema';

export const paper = pgTable('paper', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	summary: text('summary'),
	keyFindings: text('key_findings'), // JSON stringified string[]
	methodology: text('methodology'),
	limitations: text('limitations'),
	createdAt: timestamp('created_at').defaultNow()
});

export const reference = pgTable('reference', {
	id: text('id').primaryKey(),
	paperId: text('paper_id')
		.notNull()
		.references(() => paper.id, { onDelete: 'cascade' }),
	text: text('text').notNull()
});

export const job = pgTable('job', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	status: text('status').notNull().default('pending'), // pending | processing | done | failed
	paperId: text('paper_id')
		.references(() => paper.id, { onDelete: 'set null' }),
	error: text('error'),
	createdAt: timestamp('created_at').defaultNow()
});

export const paperRelations = relations(paper, ({ many }) => ({
	references: many(reference),
	jobs: many(job)
}));

export const referenceRelations = relations(reference, ({ one }) => ({
	paper: one(paper, {
		fields: [reference.paperId],
		references: [paper.id]
	})
}));

export const jobRelations = relations(job, ({ one }) => ({
	user: one(user, {
		fields: [job.userId],
		references: [user.id]
	}),
	paper: one(paper, {
		fields: [job.paperId],
		references: [paper.id]
	})
}));

export * from './auth.schema';

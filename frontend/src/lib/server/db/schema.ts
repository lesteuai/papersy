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

export const paperRelations = relations(paper, ({ many }) => ({
	references: many(reference)
}));

export const referenceRelations = relations(reference, ({ one }) => ({
	paper: one(paper, {
		fields: [reference.paperId],
		references: [paper.id]
	})
}));

export * from './auth.schema';

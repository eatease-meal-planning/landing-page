import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { sql } from 'drizzle-orm';

export const contacts = pgTable('contacts', {
  id:             uuid('id').primaryKey().defaultRandom(),
  name:           text('name').notNull(),
  email:          text('email').notNull().unique(),
  confirmed:      boolean('confirmed').notNull().default(false),
  confirmedAt:    timestamp('confirmed_at', { withTimezone: true }),
  token:          uuid('token').notNull().defaultRandom().unique(),
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true })
                    .notNull()
                    .default(sql`now() + interval '48 hours'`),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { sql } from 'drizzle-orm';

export const contacts = pgTable('contacts', {
  id:             uuid('id').primaryKey().defaultRandom(),
  name:           text('name').notNull(),
  email:          text('email').notNull().unique(),
  locale:         text('locale').notNull().default('en'),

  /**
   * Where the consent came from.
   *
   * 'form'   — filled the landing-page form and clicked the token link.
   * 'manual' — reached us off-platform (message, conversation) and asked to be
   *            let into the closed test. These rows are `confirmed` without a
   *            token ever having been clicked, so without this column the flag
   *            would claim something that never happened. Keeping the
   *            provenance here is also what lets /delete-account reach them:
   *            before this, they lived in a CSV no erasure path could touch.
   */
  source:         text('source').notNull().default('form'),

  confirmed:      boolean('confirmed').notNull().default(false),
  confirmedAt:    timestamp('confirmed_at', { withTimezone: true }),

  /**
   * When the Google Play opt-in link was mailed to this contact — set only
   * after Resend answered without an error.
   *
   * It is the send script's idempotency key: one invite per contact, and a run
   * that dies halfway resumes instead of mailing everyone twice. Note what it
   * does *not* record — registration in the Play Console is a separate manual
   * step, and it is that step, not this one, that grants access.
   */
  closedTestInvitedAt: timestamp('closed_test_invited_at', { withTimezone: true }),

  token:          uuid('token').notNull().defaultRandom().unique(),
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true })
                    .notNull()
                    .default(sql`now() + interval '48 hours'`),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;

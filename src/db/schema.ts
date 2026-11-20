import { relations } from 'drizzle-orm';
import {
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name').notNull(),
  photoUrl: text('photo_url'),
  pacePreference: text('pace_preference').default('5:30 /km').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const runs = pgTable('runs', {
  id: serial('id').primaryKey(),
  hostUserId: integer('host_user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  runDate: text('run_date').notNull(), // YYYY-MM-DD
  startTime: text('start_time').notNull(), // HH:MM (24-hour)
  meetingPoint: text('meeting_point').notNull(),
  distanceKm: doublePrecision('distance_km').notNull(),
  paceTarget: text('pace_target').notNull(), // e.g., "5:15 /km"
  paceTier: text('pace_tier').notNull(), // 'easy' | 'steady' | 'tempo' | 'intervals'
  terrain: text('terrain').notNull(), // 'road' | 'track' | 'trail'
  maxRunners: integer('max_runners'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const runRsvps = pgTable(
  'run_rsvps',
  {
    id: serial('id').primaryKey(),
    runId: integer('run_id')
      .references(() => runs.id, { onDelete: 'cascade' })
      .notNull(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    note: text('note'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('run_rsvps_run_user_idx').on(table.runId, table.userId)]
);

export const usersRelations = relations(users, ({ many }) => ({
  hostedRuns: many(runs),
  rsvps: many(runRsvps),
}));

export const runsRelations = relations(runs, ({ one, many }) => ({
  host: one(users, {
    fields: [runs.hostUserId],
    references: [users.id],
  }),
  rsvps: many(runRsvps),
}));

export const runRsvpsRelations = relations(runRsvps, ({ one }) => ({
  run: one(runs, {
    fields: [runRsvps.runId],
    references: [runs.id],
  }),
  user: one(users, {
    fields: [runRsvps.userId],
    references: [users.id],
  }),
}));

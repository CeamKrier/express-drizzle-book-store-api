import { pgTable, serial, varchar, timestamp, integer, decimal } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const books = pgTable('books', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const borrows = pgTable('borrows', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  bookId: integer('book_id')
    .notNull()
    .references(() => books.id),
  borrowedAt: timestamp('borrowed_at').defaultNow().notNull(),
  returnedAt: timestamp('returned_at'),
  score: decimal('score', { precision: 3, scale: 1 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;
export type Borrow = typeof borrows.$inferSelect;
export type NewBorrow = typeof borrows.$inferInsert;

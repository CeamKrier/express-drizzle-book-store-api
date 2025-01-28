import { eq, isNull, desc, and, isNotNull } from 'drizzle-orm';

import { db } from '@/database';
import { users, books, borrows } from '@/database/schema';
import { NewUser } from '@/database/schema';
import { withSpan, addCommonAttributes } from '@/lib/span-helper';

export interface UserWithBooks {
  id: number;
  name: string;
  books: {
    past: {
      name: string;
      userScore: number | null;
    }[];
    present: {
      name: string;
    }[];
  };
}

export class UserService {
  async listUsers() {
    return await withSpan('user.list', async (span) => {
      return await db.select({ id: users.id, name: users.name }).from(users).orderBy(users.name);
    });
  }

  async createUser(data: NewUser) {
    return await withSpan('user.create', async (span) => {
      addCommonAttributes(span, {
        'operation.name': 'createUser',
        'user.name': data.name,
      });
      const result = await db.insert(users).values(data).returning({ id: users.id });

      span.setAttribute('user.id', result[0].id);

      return result[0];
    });
  }

  async getUserWithBooks(userId: number): Promise<UserWithBooks | null> {
    return await withSpan('user.get', async (span) => {
      addCommonAttributes(span, {
        'operation.name': 'getUserWithBooks',
        'user.id': userId,
      });

      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

      if (!user[0]) return null;

      const pastBooks = await db
        .select({
          name: books.name,
          userScore: borrows.score,
        })
        .from(borrows)
        .where(and(eq(borrows.userId, userId), isNotNull(borrows.returnedAt)))
        .innerJoin(books, eq(books.id, borrows.bookId))
        .orderBy(desc(borrows.returnedAt));

      span.setAttribute('pastBooks.count', pastBooks.length);

      const presentBooks = await db
        .select({
          name: books.name,
        })
        .from(borrows)
        .where(and(eq(borrows.userId, userId), isNull(borrows.returnedAt)))
        .innerJoin(books, eq(books.id, borrows.bookId))
        .orderBy(desc(borrows.borrowedAt));

      span.setAttribute('presentBooks.count', presentBooks.length);

      return {
        id: user[0].id,
        name: user[0].name,
        books: {
          past: pastBooks.map((book) => ({
            name: book.name,
            userScore: book.userScore ? parseFloat(book.userScore) : null,
          })),
          present: presentBooks,
        },
      };
    });
  }

  async doesUserExist(userId: number): Promise<boolean> {
    return await withSpan('user.exists', async (span) => {
      addCommonAttributes(span, {
        'operation.name': 'doesUserExist',
        'user.id': userId,
      });

      const user = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      span.setAttribute('user.exists', user.length > 0);

      return user.length > 0;
    });
  }
}

export const userService = new UserService();

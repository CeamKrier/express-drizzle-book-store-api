import { eq, isNull, desc, and, isNotNull } from 'drizzle-orm';

import { db } from '@/database';
import { users, books, borrows } from '@/database/schema';
import { NewUser } from '@/database/schema';

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
    return await db.select({ id: users.id, name: users.name }).from(users).orderBy(users.name);
  }

  async createUser(data: NewUser) {
    const result = await db.insert(users).values(data).returning({ id: users.id });

    return result[0];
  }

  async getUserWithBooks(userId: number): Promise<UserWithBooks | null> {
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

    const presentBooks = await db
      .select({
        name: books.name,
      })
      .from(borrows)
      .where(and(eq(borrows.userId, userId), isNull(borrows.returnedAt)))
      .innerJoin(books, eq(books.id, borrows.bookId))
      .orderBy(desc(borrows.borrowedAt));

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
  }

  async doesUserExist(userId: number): Promise<boolean> {
    const user = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);

    return user.length > 0;
  }
}

export const userService = new UserService();

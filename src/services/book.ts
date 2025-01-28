import { eq, isNull, isNotNull, and, avg } from 'drizzle-orm';

import { userService } from '@/services/user';
import { db } from '@/database';
import { books, borrows, NewBook } from '@/database/schema';
import { CustomError } from '@/lib/custom-error';

import { addCommonAttributes, withSpan } from '@/lib/span-helper';

interface BookDetail {
  id: number;
  name: string;
  score: number | -1;
}

export class BookService {
  private async isBookAvailable(bookId: number): Promise<boolean> {
    const activeBorrow = await db
      .select()
      .from(borrows)
      .where(and(eq(borrows.bookId, bookId), isNull(borrows.returnedAt)))
      .limit(1);

    return !activeBorrow[0];
  }

  async listBooks() {
    return await withSpan('book.list', async (span) => {
      addCommonAttributes(span, {
        'operation.name': 'listBooks',
      });

      const data = await db
        .select({
          id: books.id,
          name: books.name,
        })
        .from(books)
        .orderBy(books.name);

      span.setAttribute('books.count', data.length);
      return data;
    });
  }

  async getBook(bookId: number): Promise<BookDetail | null> {
    return await withSpan('book.get', async (span) => {
      addCommonAttributes(span, {
        'operation.name': 'getBook',
        'book.id': bookId,
      });

      const book = await db.select().from(books).where(eq(books.id, bookId)).limit(1);

      if (!book[0]) return null;

      const avgScore = await db
        .select({
          score: avg(borrows.score).mapWith(Number),
        })
        .from(borrows)
        .where(and(eq(borrows.bookId, bookId), isNotNull(borrows.score)));

      return {
        id: book[0].id,
        name: book[0].name,
        score: avgScore[0]?.score ?? -1,
      };
    });
  }

  async createBook(data: NewBook) {
    return await withSpan('book.create', async (span) => {
      addCommonAttributes(span, {
        'operation.name': 'createBook',
        'book.name': data.name,
      });
      return await db.insert(books).values(data).returning({ id: books.id });
    });
  }

  async borrowBook(userId: number, bookId: number) {
    return await withSpan('book.borrow', async (span) => {
      addCommonAttributes(span, {
        'operation.name': 'borrowBook',
        'user.id': userId,
        'book.id': bookId,
      });

      const userExists = await userService.doesUserExist(userId);
      if (!userExists) {
        throw new CustomError('User not found');
      }

      const isBookAvailable = await this.isBookAvailable(bookId);
      if (!isBookAvailable) {
        throw new CustomError('Book is not available');
      }

      await db.insert(borrows).values({
        userId,
        bookId,
        borrowedAt: new Date(),
      });
    });
  }

  async returnBook(userId: number, bookId: number, score: number) {
    return await withSpan('book.return', async (span) => {
      addCommonAttributes(span, {
        'operation.name': 'returnBook',
        'user.id': userId,
        'book.id': bookId,
        score: score,
      });

      const borrowRecord = await db
        .select()
        .from(borrows)
        .where(
          and(eq(borrows.userId, userId), eq(borrows.bookId, bookId), isNull(borrows.returnedAt))
        )
        .limit(1);

      if (!borrowRecord[0]) {
        throw new CustomError('No active borrow record found');
      }

      await db
        .update(borrows)
        .set({
          returnedAt: new Date(),
          score: `${score}`,
        })
        .where(eq(borrows.id, borrowRecord[0].id));
    });
  }
}

export const bookService = new BookService();

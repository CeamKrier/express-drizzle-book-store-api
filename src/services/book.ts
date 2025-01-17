import { eq, isNull, isNotNull, and, avg } from 'drizzle-orm';

import { userService } from '@/services/user';
import { db } from '@/database';
import { books, borrows, NewBook } from '@/database/schema';
import { CustomError } from '@/lib/custom-error';
import { logger, getTraceId } from '@/middleware/logger';

interface BookDetail {
  id: number;
  name: string;
  score: number | -1;
}

export class BookService {
  async listBooks() {
    return await db
      .select({
        id: books.id,
        name: books.name,
      })
      .from(books)
      .orderBy(books.name);
  }

  async getBook(bookId: number): Promise<BookDetail | null> {
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
  }

  async createBook(data: NewBook) {
    return await db.insert(books).values(data).returning({ id: books.id });
  }

  async borrowBook(userId: number, bookId: number) {
    const traceId = getTraceId();
    logger.info('Borrowing book', { traceId, userId, bookId });

    logger.info('Checking if user exists', { traceId, userId });
    const userExists = await userService.doesUserExist(userId);
    if (!userExists) {
      throw new CustomError('User not found');
    }

    logger.info('Checking if book is available', { traceId, userId, bookId });

    const isBookAvailable = await this.isBookAvailable(bookId);
    if (!isBookAvailable) {
      throw new CustomError('Book is not available');
    }

    logger.info('Inserting borrow record', { traceId, userId, bookId });

    await db.insert(borrows).values({
      userId,
      bookId,
      borrowedAt: new Date(),
    });

    logger.info('Book borrowed successfully', { traceId, userId, bookId });
  }

  async returnBook(userId: number, bookId: number, score: number) {
    const traceId = getTraceId();
    logger.info('Returning book', { traceId, userId, bookId });
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

    logger.info('Updating borrow record', { traceId, userId, bookId });

    await db
      .update(borrows)
      .set({
        returnedAt: new Date(),
        score: `${score}`,
      })
      .where(eq(borrows.id, borrowRecord[0].id));

    logger.info('Book returned successfully', { traceId, userId, bookId });
  }

  private async isBookAvailable(bookId: number): Promise<boolean> {
    const activeBorrow = await db
      .select()
      .from(borrows)
      .where(and(eq(borrows.bookId, bookId), isNull(borrows.returnedAt)))
      .limit(1);

    return !activeBorrow[0];
  }
}

export const bookService = new BookService();

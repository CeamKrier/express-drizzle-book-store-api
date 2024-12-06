import { eq, isNull, isNotNull, and, avg } from 'drizzle-orm';

import { db } from '@/database';
import { books, borrows, NewBook } from '@/database/schema';

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
    const isBookAvailable = await this.isBookAvailable(bookId);
    if (!isBookAvailable) {
      throw new Error('Book is not available');
    }

    await db.insert(borrows).values({
      userId,
      bookId,
      borrowedAt: new Date(),
    });
  }

  async returnBook(userId: number, bookId: number, score: number) {
    const borrowRecord = await db
      .select()
      .from(borrows)
      .where(
        and(eq(borrows.userId, userId), eq(borrows.bookId, bookId), isNull(borrows.returnedAt))
      )
      .limit(1);

    if (!borrowRecord[0]) {
      throw new Error('No active borrow record found');
    }

    await db
      .update(borrows)
      .set({
        returnedAt: new Date(),
        score: `${score}`,
      })
      .where(eq(borrows.id, borrowRecord[0].id));
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

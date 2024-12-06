import { Router } from 'express';

import { handler } from '@/lib/request-helper';
import { bookService } from '@/services/book';

const router: Router = Router();

router.get(
  '/',
  handler(async (req, res) => {
    const books = await bookService.listBooks();
    res.json(books);
  })
);

router.get(
  '/:bookId',
  handler(async (req, res) => {
    const bookId = req.params.bookId;

    if (!bookId) {
      return res.status(400).json({ error: 'Book ID is required' });
    }

    const book = await bookService.getBook(parseInt(bookId));

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json(book);
  })
);

router.post(
  '/',
  handler(async (req, res) => {
    const name = req.body.name;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    await bookService.createBook({ name: name });
    res.status(201).end();
  })
);

export default router;

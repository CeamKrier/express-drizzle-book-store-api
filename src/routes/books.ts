import { Router } from 'express';

import { handler, validateBody, validateParams } from '@/lib/request-helper';
import { bookService } from '@/services/book';
import { sharedResponses } from '@/lib/response-helper';
import { bodySchemas, paramSchemas } from '@/lib/request-schemas';

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
    const { bookId } = validateParams(paramSchemas.bookId, req.params);

    const book = await bookService.getBook(bookId);

    if (!book) {
      return sharedResponses.NOT_FOUND(res, 'Book not found');
    }

    res.json(book);
  })
);

router.post(
  '/',
  handler(async (req, res) => {
    const { name } = validateBody(bodySchemas.createBook, req.body);

    await bookService.createBook({ name: name });

    res.status(201).end();
  })
);

export default router;

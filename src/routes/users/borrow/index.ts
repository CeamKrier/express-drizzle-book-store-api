import { Router } from 'express';

import { handler } from '@/lib/request-helper';
import { bookService } from '@/services/book';

const router: Router = Router({ mergeParams: true });

router.post(
  '/:bookId',
  handler(async (req, res) => {
    const userId = req.params.userId;
    const bookId = req.params.bookId;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!bookId) {
      return res.status(400).json({ error: 'Book ID is required' });
    }

    await bookService.borrowBook(parseInt(userId), parseInt(bookId));

    res.status(204).end();
  })
);

export default router;

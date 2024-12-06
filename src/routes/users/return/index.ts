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

    const score = req.body.score;

    if (!score) {
      return res.status(400).json({ error: 'Score is required' });
    }

    await bookService.returnBook(parseInt(userId), parseInt(bookId), parseFloat(score));

    res.status(204).end();
  })
);

export default router;

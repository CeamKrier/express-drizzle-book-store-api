import { Router } from 'express';

import { handler, validateParams } from '@/lib/request-helper';
import { bookService } from '@/services/book';
import { paramSchemas } from '@/lib/request-schemas';

const router: Router = Router({ mergeParams: true });

router.post(
  '/:bookId',
  handler(async (req, res) => {
    const { userId, bookId } = validateParams(paramSchemas.userAndBookId, req.params);

    await bookService.borrowBook(userId, bookId);

    res.status(204).end();
  })
);

export default router;

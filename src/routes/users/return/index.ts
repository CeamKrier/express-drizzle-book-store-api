import { Router } from 'express';

import { handler, validateBody, validateParams } from '@/lib/request-helper';
import { bookService } from '@/services/book';
import { bodySchemas, paramSchemas } from '@/lib/request-schemas';

const router: Router = Router({ mergeParams: true });

router.post(
  '/:bookId',
  handler(async (req, res) => {
    const { userId, bookId } = validateParams(paramSchemas.userAndBookId, req.params);

    const { score } = validateBody(bodySchemas.returnBook, req.body);

    await bookService.returnBook(userId, bookId, score);

    res.status(204).end();
  })
);

export default router;

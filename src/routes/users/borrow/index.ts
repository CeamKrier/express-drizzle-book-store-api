import { Router } from 'express';

import { handler, validateParams } from '@/lib/request-helper';
import { bookService } from '@/services/book';
import { paramSchemas } from '@/lib/request-schemas';
import { logger, getTraceId } from '@/middleware/logger';

const router: Router = Router({ mergeParams: true });

router.post(
  '/:bookId',
  handler(async (req, res) => {
    const traceId = getTraceId();
    logger.info('Route borrow a book', { traceId, bookId: req.params.bookId });
    const { userId, bookId } = validateParams(paramSchemas.userAndBookId, req.params);

    logger.info('Payload validated', { traceId, userId, bookId });

    await bookService.borrowBook(userId, bookId);

    logger.info('Book borrowed successfully', { traceId, userId, bookId });

    res.status(204).end();
  })
);

export default router;

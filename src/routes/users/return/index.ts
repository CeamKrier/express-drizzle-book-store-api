import { Router } from 'express';

import { handler, validateBody, validateParams } from '@/lib/request-helper';
import { bookService } from '@/services/book';
import { bodySchemas, paramSchemas } from '@/lib/request-schemas';
import { logger, getTraceId } from '@/middleware/logger';

const router: Router = Router({ mergeParams: true });

router.post(
  '/:bookId',
  handler(async (req, res) => {
    const traceId = getTraceId();
    logger.info('Route borrow a book', { traceId, bookId: req.params.bookId });

    logger.info('Validating request params', { traceId, params: req.params });
    const { userId, bookId } = validateParams(paramSchemas.userAndBookId, req.params);

    const { score } = validateBody(bodySchemas.returnBook, req.body);
    logger.info('Request params validated', { traceId, userId, bookId, score });

    await bookService.returnBook(userId, bookId, score);

    logger.info('Book returned successfully', { traceId, userId, bookId });
    res.status(204).end();
  })
);

export default router;

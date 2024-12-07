import { Router } from 'express';

import { userService } from '@/services/user';
import { paramSchemas, bodySchemas } from '@/lib/request-schemas';
import { handler, validateBody, validateParams } from '@/lib/request-helper';
import { sharedResponses } from '@/lib/response-helper';

import BorrowRouter from './borrow';
import ReturnRouter from './return';

const router: Router = Router();

router.get(
  '/',
  handler(async (req, res) => {
    const users = await userService.listUsers();

    res.json(users);
  })
);

router.get(
  '/:userId',
  handler(async (req, res) => {
    const { userId } = validateParams(paramSchemas.userId, req.params);

    const user = await userService.getUserWithBooks(userId);

    if (!user) {
      return sharedResponses.NOT_FOUND(res, 'User not found');
    }

    res.json(user);
  })
);

router.post(
  '/',
  handler(async (req, res) => {
    const { name } = validateBody(bodySchemas.createUser, req.body);

    await userService.createUser({ name: name });

    res.status(201).end();
  })
);

router.use('/:userId/borrow', BorrowRouter);
router.use('/:userId/return', ReturnRouter);

export default router;

import { Router } from 'express';

import { handler } from '@/lib/request-helper';
import { userService } from '@/services/user';

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
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await userService.getUserWithBooks(parseInt(userId));

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  })
);

router.post(
  '/',
  handler(async (req, res) => {
    const name = req.body.name;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    await userService.createUser({ name: name });
    res.status(201).end();
  })
);

router.use('/:userId/borrow', BorrowRouter);
router.use('/:userId/return', ReturnRouter);

export default router;

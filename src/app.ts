import 'dotenv/config';
import express from 'express';

import UsersRouter from '@/routes/users';
import BooksRouter from '@/routes/books';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ type: 'application/json', limit: '1mb' }));

app.use('/users', UsersRouter);
app.use('/books', BooksRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

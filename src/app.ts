import './tracing-setup';
import { tracingMiddleware } from '@/middleware/tracing';
import 'dotenv/config';
import express from 'express';

import { metricsMiddleware, registerMetrics } from '@/middleware/metrics';

import UsersRouter from '@/routes/users';
import BooksRouter from '@/routes/books';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(tracingMiddleware);

app.use(express.json({ type: 'application/json', limit: '1mb' }));

// Add metrics middleware and endpoint before other routes

app.use(metricsMiddleware);
registerMetrics(app);

app.use('/users', UsersRouter);
app.use('/books', BooksRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

import { z } from 'zod';

export const paramSchemas = {
  userId: z.object({
    userId: z.string().regex(/^\d+$/, 'Invalid user ID').transform(Number),
  }),
  bookId: z.object({
    bookId: z.string().regex(/^\d+$/, 'Invalid book ID').transform(Number),
  }),
  userAndBookId: z.object({
    userId: z.string().regex(/^\d+$/, 'Invalid user ID').transform(Number),
    bookId: z.string().regex(/^\d+$/, 'Invalid book ID').transform(Number),
  }),
};

export const bodySchemas = {
  createUser: z.object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(255, 'Name must be less than 255 characters')
      .trim(),
  }),
  createBook: z.object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(255, 'Name must be less than 255 characters')
      .trim(),
  }),
  returnBook: z.object({
    score: z
      .number({
        required_error: 'Score is required',
        invalid_type_error: 'Score must be a number',
      })
      .min(0, 'Score must be at least 0')
      .max(10, 'Score must be at most 10')
      .multipleOf(0.1, 'Score must have at most 1 decimal place'),
  }),
};

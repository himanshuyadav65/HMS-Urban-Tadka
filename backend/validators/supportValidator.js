import { body } from 'express-validator';

export const ticketValidator = [
  body('subject')
    .notEmpty()
    .withMessage('Subject is required')
    .trim(),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .trim(),
  body('description')
    .isLength({ min: 20 })
    .withMessage('Message must be at least 20 characters long')
    .trim(),
];

export const replyValidator = [
  body('message')
    .notEmpty()
    .withMessage('Reply message cannot be empty')
    .trim(),
];

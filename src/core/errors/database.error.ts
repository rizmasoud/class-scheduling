import { AppError } from './base.error';

export class DatabaseError extends AppError {
  constructor(message: string, isOperational: boolean = true) {
    super(message, 'DATABASE_ERROR', isOperational);
  }
}

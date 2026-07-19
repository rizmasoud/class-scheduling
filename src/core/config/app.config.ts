import { APP_NAME, DATABASE_NAME } from '@/core/constants';

export const appConfig = {
  app: {
    name: APP_NAME,
  },
  database: {
    name: DATABASE_NAME,
  },
} as const;

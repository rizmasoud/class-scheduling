import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { Layout } from '@/shared/components/Layout';
import { BooksPage } from '@/features/books/components/BooksPage';
import { StudentsPage } from '@/features/students/components/StudentsPage';
import { TeachersPage } from '@/features/teachers/components/TeachersPage';

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <div>Welcome to EduTech Dashboard!</div>,
});

const booksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/books',
  component: BooksPage,
});

const studentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/students',
  component: StudentsPage,
});

const teachersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/teachers',
  component: TeachersPage,
});

const routeTree = rootRoute.addChildren([indexRoute, booksRoute, studentsRoute, teachersRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { Layout } from '@/shared/components/Layout';
import { BooksPage } from '@/features/books/components/BooksPage';
import { StudentsPage } from '@/features/students/components/StudentsPage';
import { TeachersPage } from '@/features/teachers/components/TeachersPage';
import { ClassesPage } from '@/features/classes/components/ClassesPage';
import { ExamsPage } from '@/features/exams/components/ExamsPage';
import { ProposalsPage } from '@/features/proposals/components/ProposalsPage';
import { EnrollmentsPage } from '@/features/enrollments/components/EnrollmentsPage';

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

const classesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/classes',
  component: ClassesPage,
});

const examsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/exams',
  component: ExamsPage,
});

const proposalsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/proposals',
  component: ProposalsPage,
});

const enrollmentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/enrollments',
  component: EnrollmentsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute, 
  booksRoute, 
  studentsRoute, 
  teachersRoute, 
  classesRoute, 
  examsRoute, 
  proposalsRoute,
  enrollmentsRoute
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

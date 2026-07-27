import { AppShell, Burger, Group, NavLink, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, Link, useLocation } from '@tanstack/react-router';
import { BookOpen, Calendar, Users, Briefcase, GraduationCap, ClipboardCheck, FileText, UserPlus } from 'lucide-react';

export function Layout() {
  const [opened, { toggle }] = useDisclosure();
  const location = useLocation();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Title order={3}>EduTech</Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavLink
          component={Link}
          to="/"
          label="Dashboard"
          leftSection={<Calendar size={16} />}
          active={location.pathname === '/'}
        />
        <NavLink
          component={Link}
          to="/books"
          label="Books"
          leftSection={<BookOpen size={16} />}
          active={location.pathname.startsWith('/books')}
        />
        <NavLink
          component={Link}
          to="/teachers"
          label="Teachers"
          leftSection={<Briefcase size={16} />}
          active={location.pathname.startsWith('/teachers')}
        />
        <NavLink
          component={Link}
          to="/classes"
          label="Classes"
          leftSection={<GraduationCap size={16} />}
          active={location.pathname.startsWith('/classes')}
        />
        <NavLink
          component={Link}
          to="/students"
          label="Students"
          leftSection={<Users size={16} />}
          active={location.pathname.startsWith('/students')}
        />
        <NavLink
          component={Link}
          to="/enrollments"
          label="Enrollments"
          leftSection={<UserPlus size={16} />}
          active={location.pathname.startsWith('/enrollments')}
        />
        <NavLink
          component={Link}
          to="/exams"
          label="Exams"
          leftSection={<ClipboardCheck size={16} />}
          active={location.pathname.startsWith('/exams')}
        />
        <NavLink
          component={Link}
          to="/proposals"
          label="Proposals"
          leftSection={<FileText size={16} />}
          active={location.pathname.startsWith('/proposals')}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

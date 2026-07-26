import { AppShell, Burger, Group, NavLink, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, Link, useLocation } from '@tanstack/react-router';
import { BookOpen, Calendar, Users, Briefcase } from 'lucide-react';

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
          to="/students"
          label="Students"
          leftSection={<Users size={16} />}
          active={location.pathname.startsWith('/students')}
        />
        <NavLink
          component={Link}
          to="/teachers"
          label="Teachers"
          leftSection={<Briefcase size={16} />}
          active={location.pathname.startsWith('/teachers')}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

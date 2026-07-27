import { Table, ActionIcon, Group, Text, Loader, Center, Badge } from '@mantine/core';
import { Pencil, Trash2 } from 'lucide-react';
import { Class, Book, Teacher } from '@/domain/models';

interface Props {
  classes: readonly Class[];
  books: readonly Book[];
  teachers: readonly Teacher[];
  isLoading: boolean;
  onEdit: (classData: Class) => void;
  onArchive: (classData: Class) => void;
}

export function ClassList({ classes, books, teachers, isLoading, onEdit, onArchive }: Props) {
  if (isLoading) {
    return <Center p="xl"><Loader /></Center>;
  }

  if (classes.length === 0) {
    return <Center p="xl"><Text c="dimmed">No classes found.</Text></Center>;
  }

  const getBookName = (bookId: string) => {
    const book = books.find((b) => b.id === bookId);
    return book ? book.name : bookId;
  };

  const getTeacherName = (teacherId: string | null) => {
    if (!teacherId) return '-';
    const teacher = teachers.find((t) => t.id === teacherId);
    return teacher ? teacher.fullName : teacherId;
  };

  const rows = classes.map((c) => (
    <Table.Tr key={c.id}>
      <Table.Td>{c.name}</Table.Td>
      <Table.Td>{getBookName(c.bookId)}</Table.Td>
      <Table.Td>{getTeacherName(c.teacherId)}</Table.Td>
      <Table.Td>
        <Badge variant="light" color={c.status === 'Active' ? 'green' : c.status === 'Scheduled' ? 'blue' : 'gray'}>
          {c.status}
        </Badge>
      </Table.Td>
      <Table.Td>
        {c.minCapacity} / {c.targetCapacity} / {c.maxCapacity}
      </Table.Td>
      <Table.Td>{c.notes || '-'}</Table.Td>
      <Table.Td>
        <Group gap="xs">
          <ActionIcon variant="subtle" color="blue" onClick={() => onEdit(c)}>
            <Pencil size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red" onClick={() => onArchive(c)}>
            <Trash2 size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Name</Table.Th>
          <Table.Th>Book</Table.Th>
          <Table.Th>Teacher</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th>Capacity (Min/Target/Max)</Table.Th>
          <Table.Th>Notes</Table.Th>
          <Table.Th>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
}

import { Table, ActionIcon, Group, Text, Loader, Center, Badge } from '@mantine/core';
import { Pencil, Trash2 } from 'lucide-react';
import { Teacher } from '@/domain/models';
import { useActiveBooks } from '@/features/books/hooks/use-books';

interface Props {
  teachers: readonly Teacher[];
  isLoading: boolean;
  onEdit: (teacher: Teacher) => void;
  onArchive: (teacher: Teacher) => void;
}

export function TeacherList({ teachers, isLoading, onEdit, onArchive }: Props) {
  const { data: books } = useActiveBooks();

  if (isLoading) {
    return <Center p="xl"><Loader /></Center>;
  }

  if (teachers.length === 0) {
    return <Center p="xl"><Text c="dimmed">No teachers found.</Text></Center>;
  }

  const getBookName = (bookId: string) => {
    const book = books?.find((b) => b.id === bookId);
    return book ? book.name : bookId;
  };

  const rows = teachers.map((teacher) => (
    <Table.Tr key={teacher.id}>
      <Table.Td>{teacher.fullName}</Table.Td>
      <Table.Td>
        {teacher.skills && teacher.skills.length > 0 ? (
          <Group gap="xs">
            {teacher.skills.map(skill => (
              <Badge key={skill.id} variant="light">
                {getBookName(skill.bookId)}
              </Badge>
            ))}
          </Group>
        ) : '-'}
      </Table.Td>
      <Table.Td>
        {teacher.preference?.maxWeeklySessions ?? '-'}
      </Table.Td>
      <Table.Td>{teacher.notes || '-'}</Table.Td>
      <Table.Td>
        <Group gap="xs">
          <ActionIcon variant="subtle" color="blue" onClick={() => onEdit(teacher)}>
            <Pencil size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red" onClick={() => onArchive(teacher)}>
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
          <Table.Th>Full Name</Table.Th>
          <Table.Th>Skills (Books)</Table.Th>
          <Table.Th>Weekly Capacity</Table.Th>
          <Table.Th>Notes</Table.Th>
          <Table.Th>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
}

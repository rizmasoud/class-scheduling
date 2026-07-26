import { Table, ActionIcon, Group, Text, Loader, Center } from '@mantine/core';
import { Pencil, Trash2 } from 'lucide-react';
import { Student } from '@/domain/models';
import { useActiveBooks } from '@/features/books/hooks/use-books';

interface Props {
  students: readonly Student[];
  isLoading: boolean;
  onEdit: (student: Student) => void;
  onArchive: (student: Student) => void;
}

export function StudentList({ students, isLoading, onEdit, onArchive }: Props) {
  const { data: books } = useActiveBooks();

  if (isLoading) {
    return <Center p="xl"><Loader /></Center>;
  }

  if (students.length === 0) {
    return <Center p="xl"><Text c="dimmed">No students found.</Text></Center>;
  }

  const getBookName = (bookId: string) => {
    const book = books?.find((b) => b.id === bookId);
    return book ? book.name : 'Unknown';
  };

  const rows = students.map((student) => (
    <Table.Tr key={student.id}>
      <Table.Td>{student.fullName}</Table.Td>
      <Table.Td>{getBookName(student.currentBookId)}</Table.Td>
      <Table.Td>{student.notes || '-'}</Table.Td>
      <Table.Td>
        <Group gap="xs">
          <ActionIcon variant="subtle" color="blue" onClick={() => onEdit(student)}>
            <Pencil size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red" onClick={() => onArchive(student)}>
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
          <Table.Th>Current Book</Table.Th>
          <Table.Th>Notes</Table.Th>
          <Table.Th>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
}

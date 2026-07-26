import { Table, ActionIcon, Group, Text, Loader, Center } from '@mantine/core';
import { Pencil, Trash2 } from 'lucide-react';
import { Book } from '@/domain/models';

interface Props {
  books: readonly Book[];
  isLoading: boolean;
  onEdit: (book: Book) => void;
  onArchive: (book: Book) => void;
}

export function BookList({ books, isLoading, onEdit, onArchive }: Props) {
  if (isLoading) {
    return <Center p="xl"><Loader /></Center>;
  }

  if (books.length === 0) {
    return <Center p="xl"><Text c="dimmed">No books found.</Text></Center>;
  }

  const rows = books.map((book) => (
    <Table.Tr key={book.id}>
      <Table.Td>{book.name}</Table.Td>
      <Table.Td>{book.level}</Table.Td>
      <Table.Td>{book.sequenceOrder}</Table.Td>
      <Table.Td>{book.sessionCount}</Table.Td>
      <Table.Td>
        <Group gap="xs">
          <ActionIcon variant="subtle" color="blue" onClick={() => onEdit(book)}>
            <Pencil size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red" onClick={() => onArchive(book)}>
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
          <Table.Th>Level</Table.Th>
          <Table.Th>Sequence Order</Table.Th>
          <Table.Th>Session Count</Table.Th>
          <Table.Th>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
}

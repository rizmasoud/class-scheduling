import { Modal, Button, Text, Group } from '@mantine/core';
import { useArchiveBook } from '../hooks/use-books';
import { notifications } from '@mantine/notifications';
import { Book } from '@/domain/models';

interface Props {
  opened: boolean;
  onClose: () => void;
  book: Book | null;
}

export function ArchiveBookDialog({ opened, onClose, book }: Props) {
  const archiveBook = useArchiveBook();

  const handleArchive = () => {
    if (!book) return;
    
    archiveBook.mutate(book.id, {
      onSuccess: () => {
        notifications.show({ title: 'Success', message: 'Book archived successfully', color: 'green' });
        onClose();
      },
      onError: (error: any) => {
        notifications.show({ title: 'Error', message: error.message || 'Failed to archive book', color: 'red' });
      },
    });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Archive Book" centered>
      <Text>Are you sure you want to archive <strong>{book?.name}</strong>?</Text>
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onClose}>Cancel</Button>
        <Button color="red" onClick={handleArchive} loading={archiveBook.isPending}>Archive</Button>
      </Group>
    </Modal>
  );
}

import { useState } from 'react';
import { Title, Button, Group, Stack } from '@mantine/core';
import { Plus, RefreshCw } from 'lucide-react';
import { useActiveBooks } from '../hooks/use-books';
import { BookList } from './BookList';
import { CreateBookDialog } from './CreateBookDialog';
import { EditBookDialog } from './EditBookDialog';
import { ArchiveBookDialog } from './ArchiveBookDialog';
import { Book } from '@/domain/models';

export function BooksPage() {
  const { data: books, isLoading, refetch } = useActiveBooks();
  
  const [createOpened, setCreateOpened] = useState(false);
  
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [archiveBook, setArchiveBook] = useState<Book | null>(null);

  return (
    <Stack gap="lg" p="md">
      <Group justify="space-between">
        <Title order={2}>Books Management</Title>
        <Group>
          <Button 
            variant="light" 
            leftSection={<RefreshCw size={16} />} 
            onClick={() => refetch()}
            loading={isLoading}
          >
            Refresh
          </Button>
          <Button 
            leftSection={<Plus size={16} />} 
            onClick={() => setCreateOpened(true)}
          >
            Create Book
          </Button>
        </Group>
      </Group>

      <BookList 
        books={books || []} 
        isLoading={isLoading} 
        onEdit={setEditBook}
        onArchive={setArchiveBook}
      />

      <CreateBookDialog 
        opened={createOpened} 
        onClose={() => setCreateOpened(false)} 
      />

      <EditBookDialog 
        opened={!!editBook} 
        onClose={() => setEditBook(null)} 
        book={editBook}
      />

      <ArchiveBookDialog 
        opened={!!archiveBook} 
        onClose={() => setArchiveBook(null)} 
        book={archiveBook}
      />
    </Stack>
  );
}

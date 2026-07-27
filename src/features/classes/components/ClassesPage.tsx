import { useState } from 'react';
import { Title, Button, Group, Stack } from '@mantine/core';
import { Plus, RefreshCw } from 'lucide-react';
import { useActiveClasses } from '../hooks/use-classes';
import { useActiveBooks } from '@/features/books/hooks/use-books';
import { useActiveTeachers } from '@/features/teachers/hooks/use-teachers';
import { ClassList } from './ClassList';
import { CreateClassDialog } from './CreateClassDialog';
import { EditClassDialog } from './EditClassDialog';
import { ArchiveClassDialog } from './ArchiveClassDialog';
import { Class } from '@/domain/models';

export function ClassesPage() {
  const { data: classes, isLoading: classesLoading, refetch: refetchClasses } = useActiveClasses();
  const { data: books, isLoading: booksLoading, refetch: refetchBooks } = useActiveBooks();
  const { data: teachers, isLoading: teachersLoading, refetch: refetchTeachers } = useActiveTeachers();
  
  const [createOpened, setCreateOpened] = useState(false);
  
  const [editClass, setEditClass] = useState<Class | null>(null);
  const [archiveClass, setArchiveClass] = useState<Class | null>(null);

  const isLoading = classesLoading || booksLoading || teachersLoading;

  const handleRefresh = () => {
    refetchClasses();
    refetchBooks();
    refetchTeachers();
  };

  return (
    <Stack gap="lg" p="md">
      <Group justify="space-between">
        <Title order={2}>Classes Management</Title>
        <Group>
          <Button 
            variant="light" 
            leftSection={<RefreshCw size={16} />} 
            onClick={handleRefresh}
            loading={isLoading}
          >
            Refresh
          </Button>
          <Button 
            leftSection={<Plus size={16} />} 
            onClick={() => setCreateOpened(true)}
          >
            Create Class
          </Button>
        </Group>
      </Group>

      <ClassList 
        classes={classes || []} 
        books={books || []}
        teachers={teachers || []}
        isLoading={isLoading} 
        onEdit={setEditClass}
        onArchive={setArchiveClass}
      />

      <CreateClassDialog 
        opened={createOpened} 
        onClose={() => setCreateOpened(false)} 
      />

      <EditClassDialog 
        opened={!!editClass} 
        onClose={() => setEditClass(null)} 
        classData={editClass}
      />

      <ArchiveClassDialog 
        opened={!!archiveClass} 
        onClose={() => setArchiveClass(null)} 
        classData={archiveClass}
      />
    </Stack>
  );
}

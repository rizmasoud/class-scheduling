import { useState } from 'react';
import { Title, Button, Group, Stack } from '@mantine/core';
import { Plus, RefreshCw } from 'lucide-react';
import { useActiveTeachers } from '../hooks/use-teachers';
import { TeacherList } from './TeacherList';
import { CreateTeacherDialog } from './CreateTeacherDialog';
import { EditTeacherDialog } from './EditTeacherDialog';
import { ArchiveTeacherDialog } from './ArchiveTeacherDialog';
import { Teacher } from '@/domain/models';

export function TeachersPage() {
  const { data: teachers, isLoading, refetch } = useActiveTeachers();
  
  const [createOpened, setCreateOpened] = useState(false);
  
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);
  const [archiveTeacher, setArchiveTeacher] = useState<Teacher | null>(null);

  return (
    <Stack gap="lg" p="md">
      <Group justify="space-between">
        <Title order={2}>Teachers Management</Title>
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
            Create Teacher
          </Button>
        </Group>
      </Group>

      <TeacherList 
        teachers={teachers || []} 
        isLoading={isLoading} 
        onEdit={setEditTeacher}
        onArchive={setArchiveTeacher}
      />

      <CreateTeacherDialog 
        opened={createOpened} 
        onClose={() => setCreateOpened(false)} 
      />

      <EditTeacherDialog 
        opened={!!editTeacher} 
        onClose={() => setEditTeacher(null)} 
        teacher={editTeacher}
      />

      <ArchiveTeacherDialog 
        opened={!!archiveTeacher} 
        onClose={() => setArchiveTeacher(null)} 
        teacher={archiveTeacher}
      />
    </Stack>
  );
}

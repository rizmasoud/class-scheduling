import { useState } from 'react';
import { Title, Button, Group, Stack } from '@mantine/core';
import { Plus, RefreshCw } from 'lucide-react';
import { useActiveStudents } from '../hooks/use-students';
import { StudentList } from './StudentList';
import { CreateStudentDialog } from './CreateStudentDialog';
import { EditStudentDialog } from './EditStudentDialog';
import { ArchiveStudentDialog } from './ArchiveStudentDialog';
import { Student } from '@/domain/models';

import { ImportStudentsDialog } from './ImportStudentsDialog';
import { Upload } from 'lucide-react';

export function StudentsPage() {
  const { data: students, isLoading, refetch } = useActiveStudents();
  
  const [createOpened, setCreateOpened] = useState(false);
  const [importOpened, setImportOpened] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [archiveStudent, setArchiveStudent] = useState<Student | null>(null);

  return (
    <Stack gap="lg" p="md">
      <Group justify="space-between">
        <Title order={2}>Students Management</Title>
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
            variant="light"
            leftSection={<Upload size={16} />} 
            onClick={() => setImportOpened(true)}
          >
            Import CSV
          </Button>
          <Button 
            leftSection={<Plus size={16} />} 
            onClick={() => setCreateOpened(true)}
          >
            Create Student
          </Button>
        </Group>
      </Group>

      <StudentList 
        students={students || []} 
        isLoading={isLoading} 
        onEdit={setEditStudent}
        onArchive={setArchiveStudent}
      />

      <CreateStudentDialog 
        opened={createOpened} 
        onClose={() => setCreateOpened(false)} 
      />

      <ImportStudentsDialog
        opened={importOpened}
        onClose={() => setImportOpened(false)}
      />

      <EditStudentDialog 
        opened={!!editStudent} 
        onClose={() => setEditStudent(null)} 
        student={editStudent}
      />

      <ArchiveStudentDialog 
        opened={!!archiveStudent} 
        onClose={() => setArchiveStudent(null)} 
        student={archiveStudent}
      />
    </Stack>
  );
}

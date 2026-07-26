import { Modal, Button, Text, Group } from '@mantine/core';
import { useArchiveStudent } from '../hooks/use-students';
import { notifications } from '@mantine/notifications';
import { Student } from '@/domain/models';

interface Props {
  opened: boolean;
  onClose: () => void;
  student: Student | null;
}

export function ArchiveStudentDialog({ opened, onClose, student }: Props) {
  const archiveStudent = useArchiveStudent();

  const handleArchive = () => {
    if (!student) return;
    
    archiveStudent.mutate(student.id, {
      onSuccess: () => {
        notifications.show({ title: 'Success', message: 'Student archived successfully', color: 'green' });
        onClose();
      },
      onError: (error: any) => {
        notifications.show({ title: 'Error', message: error.message || 'Failed to archive student', color: 'red' });
      },
    });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Archive Student" centered>
      <Text>Are you sure you want to archive <strong>{student?.fullName}</strong>?</Text>
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onClose}>Cancel</Button>
        <Button color="red" onClick={handleArchive} loading={archiveStudent.isPending}>Archive</Button>
      </Group>
    </Modal>
  );
}

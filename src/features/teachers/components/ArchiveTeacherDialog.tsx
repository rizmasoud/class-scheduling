import { Modal, Button, Text, Group } from '@mantine/core';
import { useArchiveTeacher } from '../hooks/use-teachers';
import { notifications } from '@mantine/notifications';
import { Teacher } from '@/domain/models';

interface Props {
  opened: boolean;
  onClose: () => void;
  teacher: Teacher | null;
}

export function ArchiveTeacherDialog({ opened, onClose, teacher }: Props) {
  const archiveTeacher = useArchiveTeacher();

  const handleArchive = () => {
    if (!teacher) return;
    
    archiveTeacher.mutate(teacher.id, {
      onSuccess: () => {
        notifications.show({ title: 'Success', message: 'Teacher archived successfully', color: 'green' });
        onClose();
      },
      onError: (error: any) => {
        notifications.show({ title: 'Error', message: error.message || 'Failed to archive teacher', color: 'red' });
      },
    });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Archive Teacher" centered>
      <Text>Are you sure you want to archive <strong>{teacher?.fullName}</strong>?</Text>
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onClose}>Cancel</Button>
        <Button color="red" onClick={handleArchive} loading={archiveTeacher.isPending}>Archive</Button>
      </Group>
    </Modal>
  );
}

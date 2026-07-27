import { Modal, Button, Text, Group } from '@mantine/core';
import { useArchiveClass } from '../hooks/use-classes';
import { notifications } from '@mantine/notifications';
import { Class } from '@/domain/models';

interface Props {
  opened: boolean;
  onClose: () => void;
  classData: Class | null;
}

export function ArchiveClassDialog({ opened, onClose, classData }: Props) {
  const archiveClass = useArchiveClass();

  const handleArchive = () => {
    if (!classData) return;
    
    archiveClass.mutate(classData.id, {
      onSuccess: () => {
        notifications.show({ title: 'Success', message: 'Class archived successfully', color: 'green' });
        onClose();
      },
      onError: (error: any) => {
        notifications.show({ title: 'Error', message: error.message || 'Failed to archive class', color: 'red' });
      },
    });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Archive Class" centered>
      <Text>Are you sure you want to archive <strong>{classData?.name}</strong>?</Text>
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onClose}>Cancel</Button>
        <Button color="red" onClick={handleArchive} loading={archiveClass.isPending}>Archive</Button>
      </Group>
    </Modal>
  );
}

import { Modal, Button, Text, Group } from '@mantine/core';
import { useArchiveProposal } from '../hooks/use-proposals';
import { notifications } from '@mantine/notifications';
import { SchedulingProposal } from '@/domain/models';

interface Props {
  opened: boolean;
  onClose: () => void;
  proposal: SchedulingProposal | null;
}

export function ArchiveProposalDialog({ opened, onClose, proposal }: Props) {
  const archiveProposal = useArchiveProposal();

  const handleArchive = () => {
    if (!proposal) return;
    
    archiveProposal.mutate(proposal.id, {
      onSuccess: () => {
        notifications.show({ title: 'Success', message: 'Proposal archived successfully', color: 'green' });
        onClose();
      },
      onError: (error: any) => {
        notifications.show({ title: 'Error', message: error.message || 'Failed to archive proposal', color: 'red' });
      },
    });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Archive Proposal" centered>
      <Text>Are you sure you want to archive this proposal?</Text>
      <Text c="dimmed" size="sm" mt="sm">
        Proposal ID: {proposal?.id}
      </Text>
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onClose}>Cancel</Button>
        <Button color="red" onClick={handleArchive} loading={archiveProposal.isPending}>Archive</Button>
      </Group>
    </Modal>
  );
}

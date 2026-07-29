import React from 'react';
import { Modal, Button, Text, Group, Stack } from '@mantine/core';
import { useCommitProposal } from '../hooks/use-proposals-review';
import { ProposalId } from '@/domain/models';

interface CommitProposalDialogProps {
  opened: boolean;
  onClose: () => void;
  proposalId: ProposalId;
  classesCount: number;
}

export const CommitProposalDialog: React.FC<CommitProposalDialogProps> = ({
  opened,
  onClose,
  proposalId,
  classesCount,
}) => {
  const commitMutation = useCommitProposal();

  const handleCommit = async () => {
    await commitMutation.mutateAsync(proposalId);
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Commit Proposal" centered>
      <Stack gap="md">
        <Text size="sm">
          Are you sure you want to commit this scheduling proposal? This action will generate actual classes and enrollments.
        </Text>
        
        <Group justify="space-between" p="xs" bg="gray.1" style={{ borderRadius: 8 }}>
          <Text fw={500} size="sm">Generated Classes</Text>
          <Text fw={700} size="sm">{classesCount}</Text>
        </Group>

        <Group justify="space-between" p="xs" bg="gray.1" style={{ borderRadius: 8 }}>
          <Text fw={500} size="sm">Students Enrolled</Text>
          <Text fw={700} size="sm">N/A</Text>
        </Group>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose} color="gray" disabled={commitMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleCommit} loading={commitMutation.isPending} color="blue">
            Commit Proposal
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

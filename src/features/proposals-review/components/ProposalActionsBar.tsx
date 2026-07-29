import React, { useState } from 'react';
import { Group, Button } from '@mantine/core';
import { Check, X, RefreshCw } from 'lucide-react';
import { ProposalId } from '@/domain/models';
import { useArchiveProposal } from '../hooks/use-proposals-review';
import { CommitProposalDialog } from './CommitProposalDialog';

interface ProposalActionsBarProps {
  proposalId: ProposalId;
  classesCount: number;
  onRefresh: () => void;
}

export const ProposalActionsBar: React.FC<ProposalActionsBarProps> = ({
  proposalId,
  classesCount,
  onRefresh,
}) => {
  const archiveMutation = useArchiveProposal();
  const [commitDialogOpen, setCommitDialogOpen] = useState(false);

  const handleReject = async () => {
    await archiveMutation.mutateAsync(proposalId);
  };

  return (
    <>
      <Group justify="space-between" align="center">
        <Button
          leftSection={<RefreshCw size={16} />}
          variant="outline"
          color="gray"
          onClick={onRefresh}
        >
          Refresh
        </Button>
        <Group>
          <Button
            leftSection={<X size={16} />}
            variant="light"
            color="red"
            onClick={handleReject}
            loading={archiveMutation.isPending}
          >
            Reject Proposal
          </Button>
          <Button
            leftSection={<Check size={16} />}
            color="blue"
            onClick={() => setCommitDialogOpen(true)}
          >
            Commit Proposal
          </Button>
        </Group>
      </Group>

      <CommitProposalDialog
        opened={commitDialogOpen}
        onClose={() => setCommitDialogOpen(false)}
        proposalId={proposalId}
        classesCount={classesCount}
      />
    </>
  );
};

import { useState } from 'react';
import { Title, Button, Group, Stack } from '@mantine/core';
import { Plus, RefreshCw } from 'lucide-react';
import { useActiveProposals } from '../hooks/use-proposals';
import { ProposalList } from './ProposalList';
import { CreateProposalDialog } from './CreateProposalDialog';
import { CommitProposalDialog } from './CommitProposalDialog';
import { ArchiveProposalDialog } from './ArchiveProposalDialog';
import { SchedulingProposal } from '@/domain/models';

export function ProposalsPage() {
  const { data: proposals, isLoading, refetch } = useActiveProposals();
  
  const [createOpened, setCreateOpened] = useState(false);
  const [commitProposal, setCommitProposal] = useState<SchedulingProposal | null>(null);
  const [archiveProposal, setArchiveProposal] = useState<SchedulingProposal | null>(null);

  return (
    <Stack gap="lg" p="md">
      <Group justify="space-between">
        <Title order={2}>Proposals Management</Title>
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
            Create Proposal
          </Button>
        </Group>
      </Group>

      <ProposalList 
        proposals={proposals || []} 
        isLoading={isLoading} 
        onCommit={setCommitProposal}
        onArchive={setArchiveProposal}
      />

      <CreateProposalDialog 
        opened={createOpened} 
        onClose={() => setCreateOpened(false)} 
      />

      <CommitProposalDialog 
        opened={!!commitProposal} 
        onClose={() => setCommitProposal(null)} 
        proposal={commitProposal}
      />

      <ArchiveProposalDialog 
        opened={!!archiveProposal} 
        onClose={() => setArchiveProposal(null)} 
        proposal={archiveProposal}
      />
    </Stack>
  );
}

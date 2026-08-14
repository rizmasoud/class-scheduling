import { Table, ActionIcon, Group, Text, Loader, Center, Badge } from '@mantine/core';
import { Check, Trash2, Edit } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { SchedulingProposal } from '@/domain/models';

interface Props {
  proposals: readonly SchedulingProposal[];
  isLoading: boolean;
  onCommit: (proposal: SchedulingProposal) => void;
  onArchive: (proposal: SchedulingProposal) => void;
}

export function ProposalList({ proposals, isLoading, onCommit, onArchive }: Props) {
  if (isLoading) {
    return <Center p="xl"><Loader /></Center>;
  }

  if (proposals.length === 0) {
    return <Center p="xl"><Text c="dimmed">No proposals found.</Text></Center>;
  }

  const rows = proposals.map((proposal) => (
    <Table.Tr key={proposal.id}>
      <Table.Td>
        {new Date(proposal.generatedAt).toLocaleString()}
      </Table.Td>
      <Table.Td>
        <Badge 
          variant="light" 
          color={proposal.status === 'Committed' ? 'green' : proposal.status === 'Archived' ? 'gray' : 'blue'}
        >
          {proposal.status}
        </Badge>
      </Table.Td>
      <Table.Td>{proposal.classes?.length || 0}</Table.Td>
      <Table.Td>{new Set(proposal.classes?.flatMap(c => c.studentIds || []) || []).size}</Table.Td>
      <Table.Td>
        {proposal.unscheduledStudents && proposal.unscheduledStudents.length > 0 ? (
          <Badge color="orange">{proposal.unscheduledStudents.length}</Badge>
        ) : (
          <Badge color="gray" variant="light">0</Badge>
        )}
      </Table.Td>
      <Table.Td>{proposal.notes || '-'}</Table.Td>
      <Table.Td>
        <Group gap="xs">
          {proposal.status === 'Draft' && (
            <>
              <ActionIcon variant="subtle" color="green" onClick={() => onCommit(proposal)} title="Commit Proposal">
                <Check size={16} />
              </ActionIcon>
              <ActionIcon component={Link} to={`/proposals/${proposal.id}/edit`} variant="subtle" color="blue" title="Edit Proposal">
                <Edit size={16} />
              </ActionIcon>
              <ActionIcon variant="subtle" color="red" onClick={() => onArchive(proposal)} title="Archive Proposal">
                <Trash2 size={16} />
              </ActionIcon>
            </>
          )}
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Generated At</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th>Classes</Table.Th>
          <Table.Th>Scheduled</Table.Th>
          <Table.Th>Unscheduled</Table.Th>
          <Table.Th>Notes</Table.Th>
          <Table.Th>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
}

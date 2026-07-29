import React from 'react';
import { Container, Title, Text, Stack, SimpleGrid, Loader, Center } from '@mantine/core';
import { useActiveProposals } from '../hooks/use-proposals-review';
import { useActiveBooks } from '@/features/books/hooks/use-books';
import { useActiveTeachers } from '@/features/teachers/hooks/use-teachers';
import { ProposalClassCard } from './ProposalClassCard';
import { ProposalActionsBar } from './ProposalActionsBar';

export const ProposalReviewPage: React.FC = () => {
  const { data: proposals, isLoading: isLoadingProposals, refetch: refetchProposals } = useActiveProposals();
  const { data: books, isLoading: isLoadingBooks } = useActiveBooks();
  const { data: teachers, isLoading: isLoadingTeachers } = useActiveTeachers();

  if (isLoadingProposals || isLoadingBooks || isLoadingTeachers) {
    return (
      <Center h="50vh">
        <Loader color="blue" />
      </Center>
    );
  }

  const currentProposal = proposals && proposals.length > 0 ? proposals[0] : null;

  if (!currentProposal) {
    return (
      <Container size="xl" py="xl">
        <Center h="30vh">
          <Text size="lg" c="dimmed">No active proposals available for review.</Text>
        </Center>
      </Container>
    );
  }

  const proposalClasses = currentProposal.classes || [];

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Stack gap="xs">
          <Title order={2}>Proposal Review</Title>
          <Text c="dimmed">
            Review the generated scheduling proposal. You can commit the proposal to generate classes, or reject it to discard.
          </Text>
          <Text size="sm" c="dimmed">
            Generated at: {new Date(currentProposal.generatedAt).toLocaleString()}
          </Text>
        </Stack>

        <ProposalActionsBar
          proposalId={currentProposal.id}
          classesCount={proposalClasses.length}
          onRefresh={refetchProposals}
        />

        <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
          {proposalClasses.map((proposalClass) => {
            const book = books?.find((b) => b.id === proposalClass.bookId);
            const teacher = teachers?.find((t) => t.id === proposalClass.teacherId);

            return (
              <ProposalClassCard
                key={proposalClass.id}
                proposalClass={proposalClass}
                bookName={book?.name || 'Unknown Book'}
                teacherName={teacher?.fullName || 'Unknown Teacher'}
              />
            );
          })}
        </SimpleGrid>

        {proposalClasses.length === 0 && (
          <Center p="xl">
            <Text c="dimmed">No classes generated in this proposal.</Text>
          </Center>
        )}
      </Stack>
    </Container>
  );
};

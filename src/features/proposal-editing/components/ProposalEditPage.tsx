import React, { useState } from 'react';
import { Container, Title, Text, Stack, SimpleGrid, Loader, Center, Group, Button, ActionIcon } from '@mantine/core';
import { ArrowLeft } from 'lucide-react';
import { useProposal } from '../hooks/use-proposal-editing';
import { useActiveBooks } from '@/features/books/hooks/use-books';
import { useActiveTeachers } from '@/features/teachers/hooks/use-teachers';
import { useActiveStudents } from '@/features/students/hooks/use-students';
import { ProposalClassCard } from '@/features/proposals-review/components/ProposalClassCard';
import { ProposalId, ProposalClass } from '@/domain/models';
import { StudentTransferDialog } from './StudentTransferDialog';
import { TeacherAssignmentDialog } from './TeacherAssignmentDialog';
import { ScheduleEditorDialog } from './ScheduleEditorDialog';
import { Link, useParams } from '@tanstack/react-router';

export const ProposalEditPage: React.FC = () => {
  const { proposalId } = useParams({ strict: false });
  const typedProposalId = proposalId as ProposalId;
  
  const { data: proposal, isLoading: isLoadingProposal } = useProposal(typedProposalId);
  const { data: books, isLoading: isLoadingBooks } = useActiveBooks();
  const { data: teachers, isLoading: isLoadingTeachers } = useActiveTeachers();
  const { data: students, isLoading: isLoadingStudents } = useActiveStudents();

  const [transferOpened, setTransferOpened] = useState(false);
  const [teacherAssignOpened, setTeacherAssignOpened] = useState(false);
  const [scheduleEditOpened, setScheduleEditOpened] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ProposalClass | null>(null);

  if (isLoadingProposal || isLoadingBooks || isLoadingTeachers || isLoadingStudents) {
    return (
      <Center h="50vh">
        <Loader color="blue" />
      </Center>
    );
  }

  if (!proposal) {
    return (
      <Container size="xl" py="xl">
        <Center h="30vh">
          <Text size="lg" c="dimmed">Proposal not found.</Text>
        </Center>
      </Container>
    );
  }

  const proposalClasses = proposal.classes || [];

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Group align="center">
          <Button component={Link} to="/proposals" variant="subtle" leftSection={<ArrowLeft size={16} />}>
            Back to Proposals
          </Button>
        </Group>
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs">
            <Title order={2}>Edit Proposal</Title>
            <Text c="dimmed">
              Manually resolve scheduling conflicts by transferring students, assigning teachers, or changing schedules.
            </Text>
          </Stack>
          <Group>
            <Button variant="light" onClick={() => setTransferOpened(true)}>
              Transfer Students
            </Button>
            <Button variant="light" onClick={() => setTeacherAssignOpened(true)}>
              Assign Teacher
            </Button>
            <Button variant="light" onClick={() => setScheduleEditOpened(true)}>
              Edit Schedule
            </Button>
          </Group>
        </Group>

        <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
          {proposalClasses.map((proposalClass) => {
            const book = books?.find((b) => b.id === proposalClass.bookId);
            const teacher = teachers?.find((t) => t.id === proposalClass.teacherId);
            return (
              <Stack key={proposalClass.id} gap="xs">
                <ProposalClassCard
                  proposalClass={proposalClass}
                  bookName={book?.name || 'Unknown Book'}
                  teacherName={teacher?.fullName || 'Unknown Teacher'}
                />
              </Stack>
            );
          })}
        </SimpleGrid>
      </Stack>

      {proposal && books && teachers && students && (
        <>
          <StudentTransferDialog
            opened={transferOpened}
            onClose={() => setTransferOpened(false)}
            proposal={proposal}
            students={students}
          />
          <TeacherAssignmentDialog
            opened={teacherAssignOpened}
            onClose={() => setTeacherAssignOpened(false)}
            proposal={proposal}
            teachers={teachers}
          />
          <ScheduleEditorDialog
            opened={scheduleEditOpened}
            onClose={() => setScheduleEditOpened(false)}
            proposal={proposal}
          />
        </>
      )}
    </Container>
  );
};

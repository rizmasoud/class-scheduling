import React, { useState } from 'react';
import { Container, Title, Text, Stack, SimpleGrid, Loader, Center, Group, Button, Alert, Badge } from '@mantine/core';
import { ArrowLeft, AlertCircle, AlertTriangle } from 'lucide-react';
import { Table, Paper } from '@mantine/core';
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
  const isDraft = proposal.status === 'Draft';

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Group align="center">
          <Button component={Link} to="/proposals" variant="subtle" leftSection={<ArrowLeft size={16} />}>
            Back to Proposals
          </Button>
        </Group>

        {!isDraft && (
          <Alert icon={<AlertCircle size={16} />} title="Read-Only Mode" color="orange">
            This proposal has status <Badge variant="filled" color={proposal.status === 'Committed' ? 'green' : 'gray'}>{proposal.status}</Badge> and cannot be modified.
          </Alert>
        )}

        <Group justify="space-between" align="flex-start">
          <Stack gap="xs">
            <Group align="center">
              <Title order={2}>Edit Proposal</Title>
              <Badge color={isDraft ? 'blue' : proposal.status === 'Committed' ? 'green' : 'gray'}>
                {proposal.status}
              </Badge>
            </Group>
            <Text c="dimmed">
              Manually resolve scheduling conflicts by transferring students, assigning teachers, or changing schedules.
            </Text>
          </Stack>
          <Group>
            <Button variant="light" disabled={!isDraft} onClick={() => { setSelectedClass(null); setTransferOpened(true); }}>
              Transfer Students
            </Button>
            <Button variant="light" disabled={!isDraft} onClick={() => { setSelectedClass(null); setTeacherAssignOpened(true); }}>
              Assign Teacher
            </Button>
            <Button variant="light" disabled={!isDraft} onClick={() => { setSelectedClass(null); setScheduleEditOpened(true); }}>
              Edit Schedule
            </Button>
          </Group>
        </Group>


        {proposal.unscheduledStudents && proposal.unscheduledStudents.length > 0 && (
          <Paper withBorder p="md" radius="md">
            <Group justify="space-between" mb="md">
              <Group>
                <AlertTriangle size={20} color="orange" />
                <Title order={4}>Unscheduled Students</Title>
              </Group>
              <Badge color="orange">{proposal.unscheduledStudents.length} Unscheduled</Badge>
            </Group>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Student</Table.Th>
                  <Table.Th>Book</Table.Th>
                  <Table.Th>Reasons</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {proposal.unscheduledStudents.map((us) => {
                  const student = students?.find(s => s.id === us.studentId);
                  const book = books?.find(b => b.id === student?.currentBookId);
                  return (
                    <Table.Tr key={us.studentId}>
                      <Table.Td>{student?.fullName || us.studentId}</Table.Td>
                      <Table.Td>{book?.name || 'Unknown'}</Table.Td>
                      <Table.Td>
                        <Stack gap={4}>
                          {us.reasons.map(r => <Text key={r} size="sm" c="dimmed">{r}</Text>)}
                        </Stack>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Paper>
        )}

        <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
          {proposalClasses.map((proposalClass) => {
            const book = books?.find((b) => b.id === proposalClass.bookId);
            const teacher = teachers?.find((t) => t.id === proposalClass.teacherId);
            const studentNames = proposalClass.studentIds?.map(
              (sId) => students?.find((s) => s.id === sId)?.fullName || sId
            );
            return (
              <Stack key={proposalClass.id} gap="xs">
                <ProposalClassCard
                  proposalClass={proposalClass}
                  bookName={book?.name || 'Unknown Book'}
                  teacherName={teacher?.fullName || 'Unknown Teacher'}
                  studentNames={studentNames}
                />
                {isDraft && (
                  <Group justify="flex-end" gap="xs">
                    <Button
                      size="xs"
                      variant="subtle"
                      onClick={() => {
                        setSelectedClass(proposalClass);
                        setTransferOpened(true);
                      }}
                    >
                      Students
                    </Button>
                    <Button
                      size="xs"
                      variant="subtle"
                      onClick={() => {
                        setSelectedClass(proposalClass);
                        setTeacherAssignOpened(true);
                      }}
                    >
                      Teacher
                    </Button>
                    <Button
                      size="xs"
                      variant="subtle"
                      onClick={() => {
                        setSelectedClass(proposalClass);
                        setScheduleEditOpened(true);
                      }}
                    >
                      Schedule
                    </Button>
                  </Group>
                )}
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
            initialClassId={selectedClass?.id}
          />
          <TeacherAssignmentDialog
            opened={teacherAssignOpened}
            onClose={() => setTeacherAssignOpened(false)}
            proposal={proposal}
            teachers={teachers}
            initialClassId={selectedClass?.id}
          />
          <ScheduleEditorDialog
            opened={scheduleEditOpened}
            onClose={() => setScheduleEditOpened(false)}
            proposal={proposal}
            initialClassId={selectedClass?.id}
          />
        </>
      )}
    </Container>
  );
};

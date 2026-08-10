import { Table, ActionIcon, Group, Text, Loader, Center, Badge, Tooltip } from '@mantine/core';
import { Pencil, ArrowUpCircle } from 'lucide-react';
import { ExamResult, Class, Student } from '@/domain/models';

interface Props {
  exams: readonly ExamResult[];
  classes: readonly Class[];
  students: readonly Student[];
  isLoading: boolean;
  onEdit: (exam: ExamResult) => void;
  onPromote: (exam: ExamResult) => void;
}

export function ExamList({ exams, classes, students, isLoading, onEdit, onPromote }: Props) {
  if (isLoading) {
    return <Center p="xl"><Loader /></Center>;
  }

  if (exams.length === 0) {
    return <Center p="xl"><Text c="dimmed">No exams found.</Text></Center>;
  }

  const getEnrollmentInfo = (enrollmentId: string) => {
    for (const c of classes) {
      if (c.enrollments) {
        const enrollment = c.enrollments.find((e) => e.id === enrollmentId);
        if (enrollment) {
          const student = students.find((s) => s.id === enrollment.studentId);
          return {
            studentName: student ? student.fullName : enrollment.studentId,
            className: c.name,
          };
        }
      }
    }
    return { studentName: enrollmentId, className: '-' };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Passed': return 'green';
      case 'Conditional': return 'yellow';
      case 'Failed': return 'red';
      default: return 'gray';
    }
  };

  const rows = exams.map((exam) => {
    const info = getEnrollmentInfo(exam.classStudentId);
    return (
      <Table.Tr key={exam.id}>
        <Table.Td>{info.studentName}</Table.Td>
        <Table.Td>{info.className}</Table.Td>
        <Table.Td>{exam.score}</Table.Td>
        <Table.Td>
          <Badge variant="light" color={getStatusColor(exam.resultStatus)}>
            {exam.resultStatus}
          </Badge>
        </Table.Td>
        <Table.Td>{exam.supervisorDecision || '-'}</Table.Td>
        <Table.Td>{exam.examDate}</Table.Td>
        <Table.Td>{exam.notes || '-'}</Table.Td>
        <Table.Td>
          <Group gap="xs">
            <Tooltip label="Edit Exam">
              <ActionIcon variant="subtle" color="blue" onClick={() => onEdit(exam)}>
                <Pencil size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Promote Student">
              <ActionIcon variant="subtle" color="green" onClick={() => onPromote(exam)}>
                <ArrowUpCircle size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Student</Table.Th>
          <Table.Th>Class</Table.Th>
          <Table.Th>Score</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th>Decision</Table.Th>
          <Table.Th>Date</Table.Th>
          <Table.Th>Notes</Table.Th>
          <Table.Th>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
}

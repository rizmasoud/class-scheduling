import { Modal, Button, Text, Group, Stack, Badge } from '@mantine/core';
import { usePromoteStudent } from '../hooks/use-students';
import { notifications } from '@mantine/notifications';
import { ExamResult, Class, Student, Book } from '@/domain/models';
import { checkPromotionEligibility, findNextBook } from '@/domain/services/promotion.logic';

interface Props {
  opened: boolean;
  onClose: () => void;
  exam: ExamResult | null;
  classes: readonly Class[];
  students: readonly Student[];
  books: readonly Book[];
}

export function PromoteStudentDialog({ opened, onClose, exam, classes, students, books }: Props) {
  const promoteStudent = usePromoteStudent();

  if (!exam) return null;

  let student: Student | null = null;
  let currentClass: Class | null = null;
  
  for (const c of classes) {
    if (c.enrollments) {
      const enrollment = c.enrollments.find((e) => e.id === exam.classStudentId);
      if (enrollment) {
        currentClass = c;
        student = students.find((s) => s.id === enrollment.studentId) || null;
        break;
      }
    }
  }

  if (!student || !currentClass) {
    return (
      <Modal opened={opened} onClose={onClose} title="Promote Student" centered>
        <Text color="red">Could not find associated student or class for this exam.</Text>
      </Modal>
    );
  }

  const currentBook = books.find(b => b.id === student!.currentBookId);
  let nextBook: Book | null = null;
  let nextBookError: string | null = null;
  
  if (currentBook) {
    try {
      nextBook = findNextBook(currentBook, books);
    } catch (e: any) {
      nextBookError = e.message;
    }
  }

  const isEligible = checkPromotionEligibility(exam);

  const handlePromote = () => {
    if (!student || !exam) return;
    
    promoteStudent.mutate({
      studentId: student.id,
      examId: exam.id,
      date: new Date().toISOString().split('T')[0]
    }, {
      onSuccess: () => {
        notifications.show({ title: 'Success', message: 'Student promoted successfully', color: 'green' });
        onClose();
      },
      onError: (error: any) => {
        notifications.show({ title: 'Error', message: error.message || 'Failed to promote student', color: 'red' });
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Passed': return 'green';
      case 'Conditional': return 'yellow';
      case 'Failed': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Promote Student" centered>
      <Stack gap="md">
        <Text>Are you sure you want to promote <strong>{student.fullName}</strong>?</Text>

        <Group align="flex-start">
          <Text fw={500} w={120}>Current Book:</Text>
          <Text>{currentBook?.name || 'Unknown'}</Text>
        </Group>

        <Group align="flex-start">
          <Text fw={500} w={120}>Next Book:</Text>
          {nextBook ? (
             <Text fw={700} c="blue">{nextBook.name}</Text>
          ) : (
             <Text c="red">{nextBookError || 'None available'}</Text>
          )}
        </Group>

        <Group align="flex-start">
          <Text fw={500} w={120}>Exam Status:</Text>
          <Badge variant="light" color={getStatusColor(exam.resultStatus)}>
            {exam.resultStatus}
          </Badge>
        </Group>

        {exam.supervisorDecision && (
           <Group align="flex-start">
             <Text fw={500} w={120}>Supervisor:</Text>
             <Text>{exam.supervisorDecision}</Text>
           </Group>
        )}

        {!isEligible && (
          <Text c="red" size="sm">
            Student is not eligible for promotion. Passed or Conditional with 'Promote' decision is required.
          </Text>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handlePromote} 
            loading={promoteStudent.isPending}
            disabled={!isEligible || !nextBook}
            color="blue"
          >
            Promote
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

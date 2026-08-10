import { useState } from 'react';
import { Title, Button, Group, Stack } from '@mantine/core';
import { Plus, RefreshCw } from 'lucide-react';
import { useAllExams } from '../hooks/use-exams';
import { useActiveClasses } from '@/features/classes/hooks/use-classes';
import { useActiveStudents } from '@/features/students/hooks/use-students';
import { ExamList } from './ExamList';
import { CreateExamDialog } from './CreateExamDialog';
import { EditExamDialog } from './EditExamDialog';
import { PromoteStudentDialog } from '@/features/students/components/PromoteStudentDialog';
import { useActiveBooks } from '@/features/books/hooks/use-books';
import { ExamResult } from '@/domain/models';

export function ExamsPage() {
  const { data: exams, isLoading: examsLoading, refetch: refetchExams } = useAllExams();
  const { data: classes, isLoading: classesLoading, refetch: refetchClasses } = useActiveClasses();
  const { data: students, isLoading: studentsLoading, refetch: refetchStudents } = useActiveStudents();
  const { data: books, isLoading: booksLoading, refetch: refetchBooks } = useActiveBooks();

  const [createOpened, setCreateOpened] = useState(false);
  const [editExam, setEditExam] = useState<ExamResult | null>(null);
  const [promoteExam, setPromoteExam] = useState<ExamResult | null>(null);

  const isLoading = examsLoading || classesLoading || studentsLoading || booksLoading;

  const handleRefresh = () => {
    refetchExams();
    refetchClasses();
    refetchStudents();
    refetchBooks();
  };

  return (
    <Stack gap="lg" p="md">
      <Group justify="space-between">
        <Title order={2}>Exams Management</Title>
        <Group>
          <Button 
            variant="light" 
            leftSection={<RefreshCw size={16} />} 
            onClick={handleRefresh}
            loading={isLoading}
          >
            Refresh
          </Button>
          <Button 
            leftSection={<Plus size={16} />} 
            onClick={() => setCreateOpened(true)}
          >
            Create Exam
          </Button>
        </Group>
      </Group>

      <ExamList 
        exams={exams || []} 
        classes={classes || []}
        students={students || []}
        isLoading={isLoading} 
        onEdit={setEditExam}
        onPromote={setPromoteExam}
      />

      <CreateExamDialog 
        opened={createOpened} 
        onClose={() => setCreateOpened(false)} 
        classes={classes || []}
        students={students || []}
      />

      <EditExamDialog 
        opened={!!editExam} 
        onClose={() => setEditExam(null)} 
        exam={editExam}
        classes={classes || []}
        students={students || []}
      />

      <PromoteStudentDialog
        opened={!!promoteExam}
        onClose={() => setPromoteExam(null)}
        exam={promoteExam}
        classes={classes || []}
        students={students || []}
        books={books || []}
      />
    </Stack>
  );
}

import { useEffect } from 'react';
import { Modal, Button, TextInput, Textarea, Select, Group, Stack, NumberInput } from '@mantine/core';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUpdateExam } from '../hooks/use-exams';
import { notifications } from '@mantine/notifications';
import { ExamResult, Class, Student } from '@/domain/models';

const schema = z.object({
  id: z.string(),
  classStudentId: z.string().min(1, 'Enrollment is required'),
  score: z.number().min(0, 'Score must be at least 0').max(100, 'Score cannot exceed 100'),
  resultStatus: z.enum(['Passed', 'Conditional', 'Failed'] as const),
  supervisorDecision: z.enum(['RepeatBook', 'FreeClass', 'MoveToLowerLevel'] as const).nullable().optional(),
  examDate: z.string().min(1, 'Exam date is required'),
  notes: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  opened: boolean;
  onClose: () => void;
  exam: ExamResult | null;
  classes: readonly Class[];
  students: readonly Student[];
}

export function EditExamDialog({ opened, onClose, exam, classes, students }: Props) {
  const updateExam = useUpdateExam();
  
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: '',
      classStudentId: '',
      score: 0,
      resultStatus: 'Passed',
      supervisorDecision: null,
      examDate: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  useEffect(() => {
    if (exam) {
      reset({
        id: exam.id,
        classStudentId: exam.classStudentId,
        score: exam.score,
        resultStatus: exam.resultStatus as any,
        supervisorDecision: exam.supervisorDecision as any,
        examDate: exam.examDate,
        notes: exam.notes || '',
      });
    }
  }, [exam, reset]);

  const onSubmit = (values: FormValues) => {
    updateExam.mutate({
      ...values,
      notes: values.notes || null,
      supervisorDecision: values.supervisorDecision || null,
    }, {
      onSuccess: () => {
        notifications.show({ title: 'Success', message: 'Exam updated successfully', color: 'green' });
        onClose();
      },
      onError: (error: any) => {
        notifications.show({ title: 'Error', message: error.message || 'Failed to update exam', color: 'red' });
      },
    });
  };

  const enrollmentOptions = classes.flatMap((c) => {
    if (!c.enrollments) return [];
    return c.enrollments.map((e) => {
      const student = students.find((s) => s.id === e.studentId);
      return {
        value: e.id,
        label: `${student ? student.fullName : e.studentId} - ${c.name}`
      };
    });
  });

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Exam" centered>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="md">
          <Controller
            name="classStudentId"
            control={control}
            render={({ field }) => (
              <Select
                label="Student / Class"
                placeholder="Select Student in Class"
                data={enrollmentOptions}
                withAsterisk
                searchable
                error={errors.classStudentId?.message}
                {...field}
              />
            )}
          />
          <Controller
            name="score"
            control={control}
            render={({ field }) => (
              <NumberInput
                label="Score"
                withAsterisk
                error={errors.score?.message}
                {...field}
              />
            )}
          />
          <Controller
            name="resultStatus"
            control={control}
            render={({ field }) => (
              <Select
                label="Result Status"
                placeholder="Select Status"
                data={[
                  { value: 'Passed', label: 'Passed' },
                  { value: 'Conditional', label: 'Conditional' },
                  { value: 'Failed', label: 'Failed' },
                ]}
                withAsterisk
                error={errors.resultStatus?.message}
                {...field}
              />
            )}
          />
          <Controller
            name="supervisorDecision"
            control={control}
            render={({ field }) => (
              <Select
                label="Supervisor Decision"
                placeholder="Select Decision (Optional)"
                data={[
                  { value: 'RepeatBook', label: 'Repeat Book' },
                  { value: 'FreeClass', label: 'Free Class' },
                  { value: 'MoveToLowerLevel', label: 'Move to Lower Level' },
                ]}
                error={errors.supervisorDecision?.message}
                value={field.value || null}
                onChange={field.onChange}
                clearable
              />
            )}
          />
          <Controller
            name="examDate"
            control={control}
            render={({ field }) => (
              <TextInput
                label="Exam Date"
                type="date"
                withAsterisk
                error={errors.examDate?.message}
                {...field}
              />
            )}
          />
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Textarea
                label="Notes"
                placeholder="Optional notes"
                value={field.value || ''}
                onChange={field.onChange}
                error={errors.notes?.message}
              />
            )}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={updateExam.isPending}>Save</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

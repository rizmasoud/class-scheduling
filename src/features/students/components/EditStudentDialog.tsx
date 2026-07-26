import { useEffect } from 'react';
import { Modal, Button, TextInput, Textarea, Select, Group, Stack } from '@mantine/core';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUpdateStudent } from '../hooks/use-students';
import { useActiveBooks } from '@/features/books/hooks/use-books';
import { notifications } from '@mantine/notifications';
import { Student } from '@/domain/models';

const schema = z.object({
  id: z.string(),
  fullName: z.string().min(1, 'Full name is required'),
  currentBookId: z.string().min(1, 'Book is required'),
  notes: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  opened: boolean;
  onClose: () => void;
  student: Student | null;
}

export function EditStudentDialog({ opened, onClose, student }: Props) {
  const updateStudent = useUpdateStudent();
  const { data: books, isLoading: booksLoading } = useActiveBooks();
  
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: '',
      fullName: '',
      currentBookId: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (student) {
      reset({
        id: student.id,
        fullName: student.fullName,
        currentBookId: student.currentBookId,
        notes: student.notes || '',
      });
    }
  }, [student, reset]);

  const onSubmit = (values: FormValues) => {
    updateStudent.mutate({
      ...values,
      notes: values.notes || null,
    }, {
      onSuccess: () => {
        notifications.show({ title: 'Success', message: 'Student updated successfully', color: 'green' });
        onClose();
      },
      onError: (error: any) => {
        notifications.show({ title: 'Error', message: error.message || 'Failed to update student', color: 'red' });
      },
    });
  };

  const bookOptions = books?.map((book) => ({ value: book.id, label: book.name })) || [];

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Student" centered>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="md">
          <Controller
            name="fullName"
            control={control}
            render={({ field }) => (
              <TextInput
                label="Full Name"
                placeholder="Student Full Name"
                withAsterisk
                error={errors.fullName?.message}
                {...field}
              />
            )}
          />
          <Controller
            name="currentBookId"
            control={control}
            render={({ field }) => (
              <Select
                label="Current Book"
                placeholder="Select Book"
                data={bookOptions}
                disabled={booksLoading}
                withAsterisk
                error={errors.currentBookId?.message}
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
            <Button type="submit" loading={updateStudent.isPending}>Save</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

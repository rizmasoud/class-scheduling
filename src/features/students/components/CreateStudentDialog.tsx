import { Modal, Button, TextInput, Textarea, Select, Group, Stack } from '@mantine/core';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateStudent } from '../hooks/use-students';
import { useActiveBooks } from '@/features/books/hooks/use-books';
import { notifications } from '@mantine/notifications';

const schema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  currentBookId: z.string().min(1, 'Book is required'),
  notes: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function CreateStudentDialog({ opened, onClose }: Props) {
  const createStudent = useCreateStudent();
  const { data: books, isLoading: booksLoading } = useActiveBooks();
  
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      currentBookId: '',
      notes: '',
    },
  });

  const onSubmit = (values: FormValues) => {
    createStudent.mutate({
      ...values,
      notes: values.notes || null,
    }, {
      onSuccess: () => {
        notifications.show({ title: 'Success', message: 'Student created successfully', color: 'green' });
        reset();
        onClose();
      },
      onError: (error: any) => {
        notifications.show({ title: 'Error', message: error.message || 'Failed to create student', color: 'red' });
      },
    });
  };

  const bookOptions = books?.map((book) => ({ value: book.id, label: book.name })) || [];

  return (
    <Modal opened={opened} onClose={onClose} title="Create Student" centered>
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
            <Button type="submit" loading={createStudent.isPending}>Create</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

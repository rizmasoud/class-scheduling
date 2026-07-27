import { Modal, Button, TextInput, Textarea, Select, Group, Stack, NumberInput } from '@mantine/core';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateClass } from '../hooks/use-classes';
import { useActiveBooks } from '@/features/books/hooks/use-books';
import { useActiveTeachers } from '@/features/teachers/hooks/use-teachers';
import { notifications } from '@mantine/notifications';
import { ClassStatus } from '@/domain/models';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  bookId: z.string().min(1, 'Book is required'),
  teacherId: z.string().optional().nullable(),
  status: z.enum(['Draft', 'Scheduled', 'Active', 'Completed', 'Archived'] as const),
  minCapacity: z.number().min(1, 'Min capacity must be at least 1'),
  targetCapacity: z.number().min(1, 'Target capacity must be at least 1'),
  maxCapacity: z.number().min(1, 'Max capacity must be at least 1'),
  notes: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function CreateClassDialog({ opened, onClose }: Props) {
  const createClass = useCreateClass();
  const { data: books, isLoading: booksLoading } = useActiveBooks();
  const { data: teachers, isLoading: teachersLoading } = useActiveTeachers();
  
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      bookId: '',
      teacherId: null,
      status: 'Draft',
      minCapacity: 5,
      targetCapacity: 10,
      maxCapacity: 15,
      notes: '',
    },
  });

  const onSubmit = (values: FormValues) => {
    createClass.mutate({
      ...values,
      notes: values.notes || null,
      teacherId: values.teacherId || null,
    }, {
      onSuccess: () => {
        notifications.show({ title: 'Success', message: 'Class created successfully', color: 'green' });
        reset();
        onClose();
      },
      onError: (error: any) => {
        notifications.show({ title: 'Error', message: error.message || 'Failed to create class', color: 'red' });
      },
    });
  };

  const bookOptions = books?.map((book) => ({ value: book.id, label: book.name })) || [];
  const teacherOptions = teachers?.map((teacher) => ({ value: teacher.id, label: teacher.fullName })) || [];

  return (
    <Modal opened={opened} onClose={onClose} title="Create Class" centered>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="md">
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextInput
                label="Class Name"
                placeholder="Class Name"
                withAsterisk
                error={errors.name?.message}
                {...field}
              />
            )}
          />
          <Controller
            name="bookId"
            control={control}
            render={({ field }) => (
              <Select
                label="Book"
                placeholder="Select Book"
                data={bookOptions}
                disabled={booksLoading}
                withAsterisk
                error={errors.bookId?.message}
                {...field}
              />
            )}
          />
          <Controller
            name="teacherId"
            control={control}
            render={({ field }) => (
              <Select
                label="Teacher"
                placeholder="Select Teacher (Optional)"
                data={teacherOptions}
                disabled={teachersLoading}
                error={errors.teacherId?.message}
                value={field.value || null}
                onChange={field.onChange}
                clearable
              />
            )}
          />
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                label="Status"
                placeholder="Select Status"
                data={[
                  { value: 'Draft', label: 'Draft' },
                  { value: 'Scheduled', label: 'Scheduled' },
                  { value: 'Active', label: 'Active' },
                  { value: 'Completed', label: 'Completed' },
                  { value: 'Archived', label: 'Archived' },
                ]}
                withAsterisk
                error={errors.status?.message}
                {...field}
              />
            )}
          />
          <Group grow>
            <Controller
              name="minCapacity"
              control={control}
              render={({ field }) => (
                <NumberInput
                  label="Min Capacity"
                  withAsterisk
                  error={errors.minCapacity?.message}
                  {...field}
                />
              )}
            />
            <Controller
              name="targetCapacity"
              control={control}
              render={({ field }) => (
                <NumberInput
                  label="Target Capacity"
                  withAsterisk
                  error={errors.targetCapacity?.message}
                  {...field}
                />
              )}
            />
            <Controller
              name="maxCapacity"
              control={control}
              render={({ field }) => (
                <NumberInput
                  label="Max Capacity"
                  withAsterisk
                  error={errors.maxCapacity?.message}
                  {...field}
                />
              )}
            />
          </Group>
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
            <Button type="submit" loading={createClass.isPending}>Create</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

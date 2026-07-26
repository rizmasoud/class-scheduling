import { Modal, Button, TextInput, Textarea, MultiSelect, NumberInput, Group, Stack } from '@mantine/core';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateTeacher } from '../hooks/use-teachers';
import { useActiveBooks } from '@/features/books/hooks/use-books';
import { notifications } from '@mantine/notifications';

const schema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  maxWeeklySessions: z.number().nullable().optional(),
  skills: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function CreateTeacherDialog({ opened, onClose }: Props) {
  const createTeacher = useCreateTeacher();
  const { data: books, isLoading: booksLoading } = useActiveBooks();
  
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      maxWeeklySessions: null,
      skills: [],
      notes: '',
    },
  });

  const onSubmit = (values: FormValues) => {
    createTeacher.mutate({
      fullName: values.fullName,
      notes: values.notes || null,
      preference: {
        maxWeeklySessions: values.maxWeeklySessions || null,
      },
      skills: values.skills?.map((bookId) => ({ bookId })) || [],
    }, {
      onSuccess: () => {
        notifications.show({ title: 'Success', message: 'Teacher created successfully', color: 'green' });
        reset();
        onClose();
      },
      onError: (error: any) => {
        notifications.show({ title: 'Error', message: error.message || 'Failed to create teacher', color: 'red' });
      },
    });
  };

  const bookOptions = books?.map((book) => ({ value: book.id, label: book.name })) || [];

  return (
    <Modal opened={opened} onClose={onClose} title="Create Teacher" centered>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="md">
          <Controller
            name="fullName"
            control={control}
            render={({ field }) => (
              <TextInput
                label="Full Name"
                placeholder="Teacher Full Name"
                withAsterisk
                error={errors.fullName?.message}
                {...field}
              />
            )}
          />
          <Controller
            name="skills"
            control={control}
            render={({ field }) => (
              <MultiSelect
                label="Skills (Books)"
                placeholder="Select books they can teach"
                data={bookOptions}
                disabled={booksLoading}
                searchable
                error={errors.skills?.message}
                {...field}
              />
            )}
          />
          <Controller
            name="maxWeeklySessions"
            control={control}
            render={({ field }) => (
              <NumberInput
                label="Weekly Capacity"
                placeholder="e.g. 10"
                value={field.value !== null ? field.value : ''}
                onChange={(val) => field.onChange(val === '' ? null : Number(val))}
                error={errors.maxWeeklySessions?.message}
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
            <Button type="submit" loading={createTeacher.isPending}>Create</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

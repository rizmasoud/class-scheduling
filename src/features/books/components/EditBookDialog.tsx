import { useEffect } from 'react';
import { Modal, Button, TextInput, NumberInput, Group, Stack } from '@mantine/core';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUpdateBook } from '../hooks/use-books';
import { notifications } from '@mantine/notifications';
import { Book } from '@/domain/models';

const schema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  level: z.number().min(1, 'Level must be at least 1'),
  sequenceOrder: z.number().min(1, 'Sequence order must be at least 1'),
  sessionCount: z.number().min(1, 'Session count must be at least 1'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  opened: boolean;
  onClose: () => void;
  book: Book | null;
}

export function EditBookDialog({ opened, onClose, book }: Props) {
  const updateBook = useUpdateBook();
  
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: '',
      name: '',
      level: 1,
      sequenceOrder: 1,
      sessionCount: 10,
    },
  });

  useEffect(() => {
    if (book) {
      reset({
        id: book.id,
        name: book.name,
        level: book.level,
        sequenceOrder: book.sequenceOrder,
        sessionCount: book.sessionCount,
      });
    }
  }, [book, reset]);

  const onSubmit = (values: FormValues) => {
    // Treat as BookId
    updateBook.mutate(values as any, {
      onSuccess: () => {
        notifications.show({ title: 'Success', message: 'Book updated successfully', color: 'green' });
        onClose();
      },
      onError: (error: any) => {
        notifications.show({ title: 'Error', message: error.message || 'Failed to update book', color: 'red' });
      },
    });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Book" centered>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="md">
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextInput
                label="Name"
                placeholder="Book Name"
                withAsterisk
                error={errors.name?.message}
                {...field}
              />
            )}
          />
          <Controller
            name="level"
            control={control}
            render={({ field: { value, onChange, ...rest } }) => (
              <NumberInput
                label="Level"
                placeholder="Level"
                withAsterisk
                min={1}
                value={value}
                onChange={(val) => onChange(typeof val === 'number' ? val : 1)}
                error={errors.level?.message}
                {...rest}
              />
            )}
          />
          <Controller
            name="sequenceOrder"
            control={control}
            render={({ field: { value, onChange, ...rest } }) => (
              <NumberInput
                label="Sequence Order"
                placeholder="Sequence Order"
                withAsterisk
                min={1}
                value={value}
                onChange={(val) => onChange(typeof val === 'number' ? val : 1)}
                error={errors.sequenceOrder?.message}
                {...rest}
              />
            )}
          />
          <Controller
            name="sessionCount"
            control={control}
            render={({ field: { value, onChange, ...rest } }) => (
              <NumberInput
                label="Session Count"
                placeholder="Session Count"
                withAsterisk
                min={1}
                value={value}
                onChange={(val) => onChange(typeof val === 'number' ? val : 1)}
                error={errors.sessionCount?.message}
                {...rest}
              />
            )}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={updateBook.isPending}>Save</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

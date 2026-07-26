import { Modal, Button, TextInput, NumberInput, Group, Stack } from '@mantine/core';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateBook } from '../hooks/use-books';
import { notifications } from '@mantine/notifications';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  level: z.number().min(1, 'Level must be at least 1'),
  sequenceOrder: z.number().min(1, 'Sequence order must be at least 1'),
  sessionCount: z.number().min(1, 'Session count must be at least 1'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function CreateBookDialog({ opened, onClose }: Props) {
  const createBook = useCreateBook();
  
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      level: 1,
      sequenceOrder: 1,
      sessionCount: 10,
    },
  });

  const onSubmit = (values: FormValues) => {
    createBook.mutate(values, {
      onSuccess: () => {
        notifications.show({ title: 'Success', message: 'Book created successfully', color: 'green' });
        reset();
        onClose();
      },
      onError: (error: any) => {
        notifications.show({ title: 'Error', message: error.message || 'Failed to create book', color: 'red' });
      },
    });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Create Book" centered>
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
            <Button type="submit" loading={createBook.isPending}>Create</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

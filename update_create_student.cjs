const fs = require('fs');

const newCode = `
import { Modal, Button, TextInput, Textarea, Select, Group, Stack, Divider, Text, ActionIcon, Grid } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateStudent } from '../hooks/use-students';
import { useActiveBooks } from '@/features/books/hooks/use-books';
import { notifications } from '@mantine/notifications';

const timeRangeSchema = z.object({
  start: z.string().regex(/^([01]\\d|2[0-3]):([0-5]\\d)$/, 'HH:mm format required'),
  end: z.string().regex(/^([01]\\d|2[0-3]):([0-5]\\d)$/, 'HH:mm format required'),
}).refine(data => data.start < data.end, {
  message: 'Start must be before end',
  path: ['end'],
});

const schema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  currentBookId: z.string().min(1, 'Book is required'),
  notes: z.string().nullable().optional(),
  availableDayPattern: z.enum(['Odd', 'Even', 'Both']),
  unavailableTimeRanges: z.array(timeRangeSchema).optional(),
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
      availableDayPattern: 'Both',
      unavailableTimeRanges: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "unavailableTimeRanges"
  });

  const onSubmit = (values: FormValues) => {
    const unavailableTimeRanges = values.unavailableTimeRanges && values.unavailableTimeRanges.length > 0 
      ? values.unavailableTimeRanges.map(r => \`\${r.start}-\${r.end}\`)
      : null;

    createStudent.mutate({
      fullName: values.fullName,
      currentBookId: values.currentBookId,
      notes: values.notes || null,
      preference: {
        availableDayPattern: values.availableDayPattern,
        unavailableTimeRanges,
        notes: null
      }
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
    <Modal opened={opened} onClose={onClose} title="Create Student" centered size="lg">
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

          <Divider my="sm" label="Scheduling Preferences" labelPosition="center" />
          <Text size="sm" c="dimmed" mb="xs">
            These settings are used when generating scheduling proposals.
          </Text>

          <Controller
            name="availableDayPattern"
            control={control}
            render={({ field }) => (
              <Select
                label="Available Days"
                placeholder="Select available days"
                data={[
                  { value: 'Both', label: 'Any Day' },
                  { value: 'Odd', label: 'Odd Days (Sat, Mon, Wed)' },
                  { value: 'Even', label: 'Even Days (Sun, Tue, Thu)' },
                ]}
                withAsterisk
                error={errors.availableDayPattern?.message}
                {...field}
              />
            )}
          />

          <div>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>Unavailable Times</Text>
              <Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={() => append({ start: '', end: '' })}>
                Add Time Range
              </Button>
            </Group>
            
            {fields.map((field, index) => (
              <Group key={field.id} mb="xs" align="flex-start">
                <Controller
                  name={\`unavailableTimeRanges.\${index}.start\` as const}
                  control={control}
                  render={({ field: inputField }) => (
                    <TextInput
                      placeholder="HH:mm"
                      style={{ flex: 1 }}
                      error={errors.unavailableTimeRanges?.[index]?.start?.message}
                      {...inputField}
                    />
                  )}
                />
                <Text mt="xs">-</Text>
                <Controller
                  name={\`unavailableTimeRanges.\${index}.end\` as const}
                  control={control}
                  render={({ field: inputField }) => (
                    <TextInput
                      placeholder="HH:mm"
                      style={{ flex: 1 }}
                      error={errors.unavailableTimeRanges?.[index]?.end?.message}
                      {...inputField}
                    />
                  )}
                />
                <ActionIcon color="red" variant="subtle" mt={4} onClick={() => remove(index)}>
                  <IconTrash size={18} />
                </ActionIcon>
              </Group>
            ))}
          </div>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={createStudent.isPending}>Create</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
`;

fs.writeFileSync('src/features/students/components/CreateStudentDialog.tsx', newCode);
console.log('updated create student dialog');

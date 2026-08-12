const fs = require('fs');

const newCode = `
import { Modal, Button, TextInput, Textarea, MultiSelect, NumberInput, Group, Stack, Divider, Text, ActionIcon, Select } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateTeacher } from '../hooks/use-teachers';
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
  maxWeeklySessions: z.number().nullable().optional(),
  skills: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
  unavailableDayPattern: z.enum(['Odd', 'Even', 'Both', 'None']).optional(),
  unavailableTimeRanges: z.array(timeRangeSchema).optional(),
  preferenceNotes: z.string().nullable().optional(),
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
      unavailableDayPattern: 'None',
      unavailableTimeRanges: [],
      preferenceNotes: '',
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

    createTeacher.mutate({
      fullName: values.fullName,
      notes: values.notes || null,
      preference: {
        maxWeeklySessions: values.maxWeeklySessions || null,
        unavailableDayPattern: values.unavailableDayPattern === 'None' ? null : (values.unavailableDayPattern as 'Odd' | 'Even' | 'Both'),
        unavailableTimeRanges,
        notes: values.preferenceNotes || null,
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
    <Modal opened={opened} onClose={onClose} title="Create Teacher" centered size="lg">
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
            name="notes"
            control={control}
            render={({ field }) => (
              <Textarea
                label="General Notes"
                placeholder="Optional notes"
                value={field.value || ''}
                onChange={field.onChange}
                error={errors.notes?.message}
              />
            )}
          />

          <Divider my="sm" label="Scheduling Preferences" labelPosition="center" />
          <Text size="sm" c="dimmed" mb="xs">
            These settings are used by the scheduling engine when assigning classes.
          </Text>

          <Controller
            name="maxWeeklySessions"
            control={control}
            render={({ field }) => (
              <NumberInput
                label="Maximum Weekly Sessions"
                placeholder="e.g. 10"
                value={field.value !== null ? field.value : ''}
                onChange={(val) => field.onChange(val === '' ? null : Number(val))}
                error={errors.maxWeeklySessions?.message}
                min={0}
              />
            )}
          />

          <Controller
            name="unavailableDayPattern"
            control={control}
            render={({ field }) => (
              <Select
                label="Unavailable Days"
                placeholder="Select unavailable days"
                data={[
                  { value: 'None', label: 'None' },
                  { value: 'Both', label: 'All Days (Fully Unavailable)' },
                  { value: 'Odd', label: 'Odd Days (Sat, Mon, Wed)' },
                  { value: 'Even', label: 'Even Days (Sun, Tue, Thu)' },
                ]}
                error={errors.unavailableDayPattern?.message}
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

          <Controller
            name="preferenceNotes"
            control={control}
            render={({ field }) => (
              <Textarea
                label="Scheduling Notes"
                placeholder="Notes for scheduling"
                value={field.value || ''}
                onChange={field.onChange}
                error={errors.preferenceNotes?.message}
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
`;

fs.writeFileSync('src/features/teachers/components/CreateTeacherDialog.tsx', newCode);
console.log('updated create teacher dialog');

import { Modal, Button, Textarea, Select, Group, Stack } from '@mantine/core';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateProposal } from '../hooks/use-proposals';
import { notifications } from '@mantine/notifications';

const schema = z.object({
  status: z.enum(['Draft', 'Closed'] as const),
  notes: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function CreateProposalDialog({ opened, onClose }: Props) {
  const createProposal = useCreateProposal();
  
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: 'Draft',
      notes: '',
    },
  });

  const onSubmit = (values: FormValues) => {
    createProposal.mutate({
      status: values.status,
      notes: values.notes || null,
      classes: [],
    }, {
      onSuccess: () => {
        notifications.show({ title: 'Success', message: 'Proposal created successfully', color: 'green' });
        reset();
        onClose();
      },
      onError: (error: any) => {
        notifications.show({ title: 'Error', message: error.message || 'Failed to create proposal', color: 'red' });
      },
    });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Create Proposal" centered>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="md">
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                label="Status"
                placeholder="Select Status"
                data={[
                  { value: 'Draft', label: 'Draft' },
                  { value: 'Closed', label: 'Closed' },
                ]}
                withAsterisk
                error={errors.status?.message}
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
            <Button type="submit" loading={createProposal.isPending}>Create</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

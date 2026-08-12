import { Modal, Button, NumberInput, MultiSelect, Group, Stack, TextInput, Divider, Text, Alert } from '@mantine/core';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useGenerateProposal } from '../hooks/use-proposals';
import { notifications } from '@mantine/notifications';
import { useNavigate } from '@tanstack/react-router';
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';

const schema = z.object({
  minimumCapacity: z.number().min(1),
  preferredCapacity: z.number().min(1),
  maximumCapacity: z.number().min(1),
  teacherPreferenceWeight: z.number().min(0).max(10),
  capacityWeight: z.number().min(0).max(10),
  bookCompatibilityWeight: z.number().min(0).max(10),
  allowedDaysOfWeek: z.array(z.string()).min(1, 'Select at least one day'),
  openingTime: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, 'Must be HH:mm'),
  closingTime: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, 'Must be HH:mm'),
  classDurationMinutes: z.number().min(10),
}).refine(data => data.maximumCapacity >= data.preferredCapacity && data.preferredCapacity >= data.minimumCapacity, {
  message: 'Capacity must be minimum <= preferred <= maximum',
  path: ['maximumCapacity']
});

type FormValues = z.infer<typeof schema>;

interface Props {
  opened: boolean;
  onClose: () => void;
}

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function CreateProposalDialog({ opened, onClose }: Props) {
  const generateProposal = useGenerateProposal();
  const navigate = useNavigate();
  const [emptyResult, setEmptyResult] = useState(false);
  
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      minimumCapacity: 5,
      preferredCapacity: 10,
      maximumCapacity: 15,
      teacherPreferenceWeight: 1,
      capacityWeight: 1,
      bookCompatibilityWeight: 1,
      allowedDaysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      openingTime: '08:00',
      closingTime: '17:00',
      classDurationMinutes: 120,
    },
  });

  const onSubmit = (values: FormValues) => {
    setEmptyResult(false);
    generateProposal.mutate({
      date: new Date().toISOString(),
      config: {
        minimumCapacity: values.minimumCapacity,
        preferredCapacity: values.preferredCapacity,
        maximumCapacity: values.maximumCapacity,
        ruleWeights: {
          teacherPreferenceWeight: values.teacherPreferenceWeight,
          capacityWeight: values.capacityWeight,
          bookCompatibilityWeight: values.bookCompatibilityWeight,
        },
        timeSlotConfig: {
          allowedDaysOfWeek: values.allowedDaysOfWeek,
          instituteHours: {
            openingTime: values.openingTime,
            closingTime: values.closingTime,
          },
          classDurationMinutes: values.classDurationMinutes,
        },
      }
    }, {
      onSuccess: (data) => {
        if (!data.classes || data.classes.length === 0) {
          setEmptyResult(true);
        } else {
          notifications.show({ title: 'Success', message: 'Proposal generated successfully', color: 'green' });
          navigate({ to: `/proposals/${data.id}/edit` });
          reset();
          onClose();
        }
      },
      onError: (error: any) => {
        notifications.show({ title: 'Error', message: error.message || 'Failed to generate proposal', color: 'red' });
      },
    });
  };

  const handleClose = () => {
    setEmptyResult(false);
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Generate Proposal" centered size="lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="md">
          {emptyResult && (
            <Alert icon={<AlertCircle size={16} />} title="No Classes Generated" color="orange">
              No valid classes could be generated with the current constraints. 
              Please check if there are eligible unassigned students, available teachers matching book skills, and if capacities/time constraints are not too restrictive.
            </Alert>
          )}

          <Text fw={500} size="sm">Class Capacity Constraints</Text>
          <Group grow>
            <Controller
              name="minimumCapacity"
              control={control}
              render={({ field }) => (
                <NumberInput label="Minimum" min={1} error={errors.minimumCapacity?.message} {...field} />
              )}
            />
            <Controller
              name="preferredCapacity"
              control={control}
              render={({ field }) => (
                <NumberInput label="Preferred" min={1} error={errors.preferredCapacity?.message} {...field} />
              )}
            />
            <Controller
              name="maximumCapacity"
              control={control}
              render={({ field }) => (
                <NumberInput label="Maximum" min={1} error={errors.maximumCapacity?.message} {...field} />
              )}
            />
          </Group>

          <Divider />

          <Text fw={500} size="sm">Time & Schedule Configuration</Text>
          <Controller
            name="allowedDaysOfWeek"
            control={control}
            render={({ field }) => (
              <MultiSelect
                label="Allowed Days of Week"
                data={daysOfWeek}
                error={errors.allowedDaysOfWeek?.message}
                {...field}
              />
            )}
          />
          <Group grow>
            <Controller
              name="openingTime"
              control={control}
              render={({ field }) => (
                <TextInput label="Opening Time" placeholder="08:00" error={errors.openingTime?.message} {...field} />
              )}
            />
            <Controller
              name="closingTime"
              control={control}
              render={({ field }) => (
                <TextInput label="Closing Time" placeholder="17:00" error={errors.closingTime?.message} {...field} />
              )}
            />
            <Controller
              name="classDurationMinutes"
              control={control}
              render={({ field }) => (
                <NumberInput label="Duration (mins)" min={10} step={10} error={errors.classDurationMinutes?.message} {...field} />
              )}
            />
          </Group>

          <Divider />

          <Text fw={500} size="sm">Optimization Weights</Text>
          <Group grow>
            <Controller
              name="teacherPreferenceWeight"
              control={control}
              render={({ field }) => (
                <NumberInput label="Teacher Pref Weight" min={0} max={10} error={errors.teacherPreferenceWeight?.message} {...field} />
              )}
            />
            <Controller
              name="capacityWeight"
              control={control}
              render={({ field }) => (
                <NumberInput label="Capacity Weight" min={0} max={10} error={errors.capacityWeight?.message} {...field} />
              )}
            />
            <Controller
              name="bookCompatibilityWeight"
              control={control}
              render={({ field }) => (
                <NumberInput label="Book Compat Weight" min={0} max={10} error={errors.bookCompatibilityWeight?.message} {...field} />
              )}
            />
          </Group>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleClose}>Cancel</Button>
            <Button type="submit" loading={generateProposal.isPending}>Generate Proposal</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

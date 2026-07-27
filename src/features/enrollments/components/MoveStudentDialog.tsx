import { Modal, Button, Select, Group, Stack, TextInput } from '@mantine/core';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMoveStudent } from '../hooks/use-enrollments';
import { notifications } from '@mantine/notifications';
import { Class, Student } from '@/domain/models';
import { useMemo } from 'react';

const schema = z.object({
  oldClassId: z.string().min(1, 'Old class is required'),
  newClassId: z.string().min(1, 'New class is required'),
  studentId: z.string().min(1, 'Student is required'),
  date: z.string().min(1, 'Date is required'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  opened: boolean;
  onClose: () => void;
  classes: readonly Class[];
  students: readonly Student[];
}

export function MoveStudentDialog({ opened, onClose, classes, students }: Props) {
  const moveStudent = useMoveStudent();
  
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      oldClassId: '',
      newClassId: '',
      studentId: '',
      date: new Date().toISOString().split('T')[0],
    },
  });

  const selectedOldClassId = useWatch({ control, name: 'oldClassId' });

  const studentOptions = useMemo(() => {
    if (!selectedOldClassId) return [];
    const oldClass = classes.find((c) => c.id === selectedOldClassId);
    if (!oldClass || !oldClass.enrollments) return [];
    
    return oldClass.enrollments
      .filter((e) => e.enrollmentStatus === 'Active')
      .map((e) => {
        const student = students.find((s) => s.id === e.studentId);
        return {
          value: e.studentId,
          label: student ? student.fullName : e.studentId,
        };
      });
  }, [selectedOldClassId, classes, students]);

  const newClassOptions = useMemo(() => {
    return classes
      .filter((c) => c.id !== selectedOldClassId)
      .map((c) => ({ value: c.id, label: c.name }));
  }, [selectedOldClassId, classes]);

  const onSubmit = (values: FormValues) => {
    moveStudent.mutate(values, {
      onSuccess: () => {
        notifications.show({ title: 'Success', message: 'Student moved successfully', color: 'green' });
        reset();
        onClose();
      },
      onError: (error: any) => {
        notifications.show({ title: 'Error', message: error.message || 'Failed to move student', color: 'red' });
      },
    });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Move Student Between Classes" centered>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="md">
          <Controller
            name="oldClassId"
            control={control}
            render={({ field }) => (
              <Select
                label="Old Class"
                placeholder="Select Current Class"
                data={classes.map((c) => ({ value: c.id, label: c.name }))}
                withAsterisk
                searchable
                error={errors.oldClassId?.message}
                {...field}
              />
            )}
          />
          <Controller
            name="studentId"
            control={control}
            render={({ field }) => (
              <Select
                label="Student"
                placeholder="Select Enrolled Student"
                data={studentOptions}
                withAsterisk
                searchable
                disabled={!selectedOldClassId}
                error={errors.studentId?.message}
                {...field}
              />
            )}
          />
          <Controller
            name="newClassId"
            control={control}
            render={({ field }) => (
              <Select
                label="New Class"
                placeholder="Select Destination Class"
                data={newClassOptions}
                withAsterisk
                searchable
                error={errors.newClassId?.message}
                {...field}
              />
            )}
          />
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <TextInput
                label="Date"
                type="date"
                withAsterisk
                error={errors.date?.message}
                {...field}
              />
            )}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={moveStudent.isPending}>Move</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

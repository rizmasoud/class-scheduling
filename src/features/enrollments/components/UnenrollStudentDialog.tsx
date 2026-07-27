import { Modal, Button, Select, Group, Stack, TextInput } from '@mantine/core';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUnenrollStudent } from '../hooks/use-enrollments';
import { notifications } from '@mantine/notifications';
import { Class, Student } from '@/domain/models';
import { useMemo } from 'react';

const schema = z.object({
  classId: z.string().min(1, 'Class is required'),
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

export function UnenrollStudentDialog({ opened, onClose, classes, students }: Props) {
  const unenrollStudent = useUnenrollStudent();
  
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      classId: '',
      studentId: '',
      date: new Date().toISOString().split('T')[0],
    },
  });

  const selectedClassId = useWatch({ control, name: 'classId' });

  const studentOptions = useMemo(() => {
    if (!selectedClassId) return [];
    const selectedClass = classes.find((c) => c.id === selectedClassId);
    if (!selectedClass || !selectedClass.enrollments) return [];
    
    return selectedClass.enrollments
      .filter((e) => e.enrollmentStatus === 'Active')
      .map((e) => {
        const student = students.find((s) => s.id === e.studentId);
        return {
          value: e.studentId,
          label: student ? student.fullName : e.studentId,
        };
      });
  }, [selectedClassId, classes, students]);

  const onSubmit = (values: FormValues) => {
    unenrollStudent.mutate(values, {
      onSuccess: () => {
        notifications.show({ title: 'Success', message: 'Student unenrolled successfully', color: 'green' });
        reset();
        onClose();
      },
      onError: (error: any) => {
        notifications.show({ title: 'Error', message: error.message || 'Failed to unenroll student', color: 'red' });
      },
    });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Unenroll Student" centered>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="md">
          <Controller
            name="classId"
            control={control}
            render={({ field }) => (
              <Select
                label="Class"
                placeholder="Select Class"
                data={classes.map((c) => ({ value: c.id, label: c.name }))}
                withAsterisk
                searchable
                error={errors.classId?.message}
                {...field}
                onChange={(value) => {
                  field.onChange(value);
                  // Reset student selection when class changes
                }}
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
                disabled={!selectedClassId}
                error={errors.studentId?.message}
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
            <Button type="submit" color="red" loading={unenrollStudent.isPending}>Unenroll</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

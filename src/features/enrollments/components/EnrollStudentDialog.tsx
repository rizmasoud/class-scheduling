import { Modal, Button, Select, Group, Stack, TextInput } from '@mantine/core';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEnrollStudent } from '../hooks/use-enrollments';
import { notifications } from '@mantine/notifications';
import { Class, Student } from '@/domain/models';

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

export function EnrollStudentDialog({ opened, onClose, classes, students }: Props) {
  const enrollStudent = useEnrollStudent();
  
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      classId: '',
      studentId: '',
      date: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = (values: FormValues) => {
    enrollStudent.mutate(values, {
      onSuccess: () => {
        notifications.show({ title: 'Success', message: 'Student enrolled successfully', color: 'green' });
        reset();
        onClose();
      },
      onError: (error: any) => {
        notifications.show({ title: 'Error', message: error.message || 'Failed to enroll student', color: 'red' });
      },
    });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Enroll Student" centered>
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
              />
            )}
          />
          <Controller
            name="studentId"
            control={control}
            render={({ field }) => (
              <Select
                label="Student"
                placeholder="Select Student"
                data={students.map((s) => ({ value: s.id, label: s.fullName }))}
                withAsterisk
                searchable
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
            <Button type="submit" loading={enrollStudent.isPending}>Enroll</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

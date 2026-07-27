import { useState } from 'react';
import { Title, Button, Group, Stack, Table, Badge, Center, Loader, Text } from '@mantine/core';
import { Plus, RefreshCw, UserMinus, ArrowRightLeft } from 'lucide-react';
import { useActiveClasses } from '@/features/classes/hooks/use-classes';
import { useActiveStudents } from '@/features/students/hooks/use-students';
import { EnrollStudentDialog } from './EnrollStudentDialog';
import { UnenrollStudentDialog } from './UnenrollStudentDialog';
import { MoveStudentDialog } from './MoveStudentDialog';

export function EnrollmentsPage() {
  const { data: classes, isLoading: classesLoading, refetch: refetchClasses } = useActiveClasses();
  const { data: students, isLoading: studentsLoading, refetch: refetchStudents } = useActiveStudents();
  
  const [enrollOpened, setEnrollOpened] = useState(false);
  const [unenrollOpened, setUnenrollOpened] = useState(false);
  const [moveOpened, setMoveOpened] = useState(false);

  const isLoading = classesLoading || studentsLoading;

  const handleRefresh = () => {
    refetchClasses();
    refetchStudents();
  };

  const allEnrollments = classes?.flatMap((c) => 
    (c.enrollments || []).map((e) => ({
      ...e,
      className: c.name,
      studentName: students?.find(s => s.id === e.studentId)?.fullName || e.studentId
    }))
  ) || [];

  const renderContent = () => {
    if (isLoading) {
      return <Center p="xl"><Loader /></Center>;
    }

    if (allEnrollments.length === 0) {
      return <Center p="xl"><Text c="dimmed">No enrollments found.</Text></Center>;
    }

    return (
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Student</Table.Th>
            <Table.Th>Class</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Joined At</Table.Th>
            <Table.Th>Left At</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {allEnrollments.map((enrollment) => (
            <Table.Tr key={enrollment.id}>
              <Table.Td>{enrollment.studentName}</Table.Td>
              <Table.Td>{enrollment.className}</Table.Td>
              <Table.Td>
                <Badge 
                  variant="light" 
                  color={
                    enrollment.enrollmentStatus === 'Active' ? 'green' : 
                    enrollment.enrollmentStatus === 'Dropped' ? 'red' : 'gray'
                  }
                >
                  {enrollment.enrollmentStatus}
                </Badge>
              </Table.Td>
              <Table.Td>{enrollment.joinedAt}</Table.Td>
              <Table.Td>{enrollment.leftAt || '-'}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    );
  };

  return (
    <Stack gap="lg" p="md">
      <Group justify="space-between">
        <Title order={2}>Enrollments</Title>
        <Group>
          <Button 
            variant="light" 
            leftSection={<RefreshCw size={16} />} 
            onClick={handleRefresh}
            loading={isLoading}
          >
            Refresh
          </Button>
          <Button 
            variant="default"
            leftSection={<UserMinus size={16} />} 
            onClick={() => setUnenrollOpened(true)}
          >
            Unenroll
          </Button>
          <Button 
            variant="default"
            leftSection={<ArrowRightLeft size={16} />} 
            onClick={() => setMoveOpened(true)}
          >
            Move
          </Button>
          <Button 
            leftSection={<Plus size={16} />} 
            onClick={() => setEnrollOpened(true)}
          >
            Enroll Student
          </Button>
        </Group>
      </Group>

      {renderContent()}

      <EnrollStudentDialog 
        opened={enrollOpened} 
        onClose={() => setEnrollOpened(false)} 
        classes={classes || []}
        students={students || []}
      />

      <UnenrollStudentDialog 
        opened={unenrollOpened} 
        onClose={() => setUnenrollOpened(false)} 
        classes={classes || []}
        students={students || []}
      />

      <MoveStudentDialog 
        opened={moveOpened} 
        onClose={() => setMoveOpened(false)} 
        classes={classes || []}
        students={students || []}
      />
    </Stack>
  );
}

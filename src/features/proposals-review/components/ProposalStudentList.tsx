import React from 'react';
import { Badge, ScrollArea, Group, Text } from '@mantine/core';
import { Users } from 'lucide-react';

interface ProposalStudentListProps {
  students: string[];
}

export const ProposalStudentList: React.FC<ProposalStudentListProps> = ({ students }) => {
  if (!students || students.length === 0) {
    return (
      <Group gap="xs" mt="sm">
        <Users size={16} color="gray" />
        <Text size="sm" c="dimmed">No students assigned</Text>
      </Group>
    );
  }

  return (
    <ScrollArea h={60} type="auto" offsetScrollbars mt="sm">
      <Group gap="xs">
        {students.map((student, index) => (
          <Badge key={index} variant="light" color="blue" size="sm">
            {student}
          </Badge>
        ))}
      </Group>
    </ScrollArea>
  );
};

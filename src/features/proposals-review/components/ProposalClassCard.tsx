import React from 'react';
import { Card, Text, Group, Badge, Stack, Divider } from '@mantine/core';
import { Book as BookIcon, User, Calendar, Clock } from 'lucide-react';
import { ProposalClass } from '@/domain/models';
import { ProposalStudentList } from './ProposalStudentList';
import { ProposalReasonsPanel } from './ProposalReasonsPanel';

interface ProposalClassCardProps {
  proposalClass: ProposalClass;
  bookName: string;
  teacherName: string;
}

export const ProposalClassCard: React.FC<ProposalClassCardProps> = ({
  proposalClass,
  bookName,
  teacherName,
}) => {
  const schedules = proposalClass.schedules || [];
  const students: string[] = [...(proposalClass.studentIds || [])];

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Text fw={600} size="lg">
            {proposalClass.generatedName || `${bookName} - ${teacherName}`}
          </Text>
          <Badge color={proposalClass.score >= 0 ? 'green' : 'red'} variant="light">
            Score: {proposalClass.score.toFixed(1)}
          </Badge>
        </Group>
      </Card.Section>

      <Stack gap="sm" mt="md">
        <Group gap="xs">
          <BookIcon size={16} color="gray" />
          <Text size="sm">{bookName}</Text>
        </Group>
        
        <Group gap="xs">
          <User size={16} color="gray" />
          <Text size="sm">{teacherName || 'No Teacher Assigned'}</Text>
        </Group>

        {schedules.length > 0 ? (
          schedules.map((schedule) => (
            <Group key={schedule.id} gap="md">
              <Group gap="xs">
                <Calendar size={16} color="gray" />
                <Text size="sm">{schedule.weekDay}</Text>
              </Group>
              <Group gap="xs">
                <Clock size={16} color="gray" />
                <Text size="sm">
                  {schedule.startTime} - {schedule.endTime}
                </Text>
              </Group>
            </Group>
          ))
        ) : (
          <Text size="sm" c="dimmed">No schedule available</Text>
        )}
      </Stack>

      <Divider my="sm" />

      <Text fw={500} size="sm">Students</Text>
      <ProposalStudentList students={students} />

      <Divider my="sm" />

      <Text fw={500} size="sm">Optimization Reasons</Text>
      <ProposalReasonsPanel reasons={proposalClass.reasons} />
    </Card>
  );
};

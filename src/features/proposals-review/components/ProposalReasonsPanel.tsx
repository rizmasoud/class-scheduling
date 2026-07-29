import React from 'react';
import { Stack, Text, Group, ThemeIcon } from '@mantine/core';
import { Check, X } from 'lucide-react';

interface ProposalReasonsPanelProps {
  reasons: string[];
}

export const ProposalReasonsPanel: React.FC<ProposalReasonsPanelProps> = ({ reasons }) => {
  if (!reasons || reasons.length === 0) {
    return (
      <Text size="sm" c="dimmed" mt="xs">
        No optimization reasons provided.
      </Text>
    );
  }

  return (
    <Stack gap="xs" mt="sm">
      {reasons.map((reason, index) => {
        const isPositive = reason.startsWith('+');
        const isNegative = reason.startsWith('-');
        
        let color = 'gray';
        let Icon = Check;
        
        if (isPositive) {
          color = 'green';
          Icon = Check;
        } else if (isNegative) {
          color = 'red';
          Icon = X;
        }

        return (
          <Group key={index} gap="sm" wrap="nowrap">
            <ThemeIcon color={color} size="sm" variant="light" radius="xl">
              <Icon size={12} />
            </ThemeIcon>
            <Text size="sm" c={color === 'gray' ? 'dimmed' : undefined}>
              {reason.replace(/^[+-]\s*/, '')}
            </Text>
          </Group>
        );
      })}
    </Stack>
  );
};

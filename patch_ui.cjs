const fs = require('fs');
let path = 'src/features/proposal-editing/components/ProposalEditPage.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `import { ArrowLeft, AlertCircle } from 'lucide-react';`,
  `import { ArrowLeft, AlertCircle, AlertTriangle } from 'lucide-react';\nimport { Table, Paper } from '@mantine/core';`
);

const uiAdd = `
        {proposal.unscheduledStudents && proposal.unscheduledStudents.length > 0 && (
          <Paper withBorder p="md" radius="md">
            <Group justify="space-between" mb="md">
              <Group>
                <AlertTriangle size={20} color="orange" />
                <Title order={4}>Unscheduled Students</Title>
              </Group>
              <Badge color="orange">{proposal.unscheduledStudents.length} Unscheduled</Badge>
            </Group>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Student</Table.Th>
                  <Table.Th>Book</Table.Th>
                  <Table.Th>Reasons</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {proposal.unscheduledStudents.map((us) => {
                  const student = students?.find(s => s.id === us.studentId);
                  const book = books?.find(b => b.id === student?.currentBookId);
                  return (
                    <Table.Tr key={us.studentId}>
                      <Table.Td>{student?.fullName || us.studentId}</Table.Td>
                      <Table.Td>{book?.name || 'Unknown'}</Table.Td>
                      <Table.Td>
                        <Stack gap={4}>
                          {us.reasons.map(r => <Text key={r} size="sm" c="dimmed">{r}</Text>)}
                        </Stack>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Paper>
        )}
`;

code = code.replace(
  `        <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">`,
  uiAdd + `\n        <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">`
);

fs.writeFileSync(path, code);
console.log('patched UI');

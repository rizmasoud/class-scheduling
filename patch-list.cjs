const fs = require('fs');
const file = 'src/features/proposals/components/ProposalList.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '<Table.Th>Classes</Table.Th>',
  '<Table.Th>Classes</Table.Th>\n          <Table.Th>Scheduled</Table.Th>\n          <Table.Th>Unscheduled</Table.Th>'
);

content = content.replace(
  '<Table.Td>{proposal.classes?.length || 0}</Table.Td>',
  `<Table.Td>{proposal.classes?.length || 0}</Table.Td>
      <Table.Td>{new Set(proposal.classes?.flatMap(c => c.studentIds || []) || []).size}</Table.Td>
      <Table.Td>
        {proposal.unscheduledStudents && proposal.unscheduledStudents.length > 0 ? (
          <Badge color="orange">{proposal.unscheduledStudents.length}</Badge>
        ) : (
          <Badge color="gray" variant="light">0</Badge>
        )}
      </Table.Td>`
);

fs.writeFileSync(file, content);
console.log('Patched ProposalList.tsx');

const fs = require('fs');
const file = 'src/features/proposal-editing/components/ProposalEditPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add formatReason
content = content.replace(
  'export const ProposalEditPage: React.FC = () => {',
  `const formatReason = (reason: string) => {
  switch (reason) {
    case 'NO_ELIGIBLE_TEACHER': return 'No eligible teacher available';
    case 'NO_VALID_TIME_SLOTS': return 'No valid time slots found';
    case 'NO_MUTUAL_AVAILABILITY': return 'No overlapping availability with group';
    case 'OPTIMIZER_CONFLICT': return 'Conflicting schedule in optimizer';
    case 'TEACHER_CAPACITY_REACHED': return 'Teacher capacity reached';
    default: return reason.replace(/_/g, ' ').toLowerCase().replace(/\\b\\w/g, c => c.toUpperCase());
  }
};

export const ProposalEditPage: React.FC = () => {`
);

// Add badges to header
content = content.replace(
  `              <Badge color={isDraft ? 'blue' : proposal.status === 'Committed' ? 'green' : 'gray'}>
                {proposal.status}
              </Badge>
            </Group>`,
  `              <Badge color={isDraft ? 'blue' : proposal.status === 'Committed' ? 'green' : 'gray'}>
                {proposal.status}
              </Badge>
              <Badge color="green">
                {new Set(proposalClasses.flatMap(c => c.studentIds || [])).size} Scheduled
              </Badge>
              {proposal.unscheduledStudents && proposal.unscheduledStudents.length > 0 && (
                <Badge color="orange">
                  {proposal.unscheduledStudents.length} Unscheduled
                </Badge>
              )}
            </Group>`
);

// Remove badges from Unscheduled section
content = content.replace(
  `              <Group>
                <Badge color="green">
                  {new Set(proposalClasses.flatMap(c => c.studentIds || [])).size} Scheduled
                </Badge>
                <Badge color="orange">
                  {proposal.unscheduledStudents.length} Unscheduled
                </Badge>
              </Group>`,
  ``
);

// Format the reasons in the table
content = content.replace(
  `{us.reasons.map(r => <Text key={r} size="sm" c="dimmed">{r}</Text>)}`,
  `{us.reasons.map(r => <Text key={r} size="sm" c="dimmed">{formatReason(r)}</Text>)}`
);

fs.writeFileSync(file, content);
console.log('Patched ProposalEditPage.tsx');

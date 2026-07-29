import fs from 'fs';

const path = 'src/features/proposals/components/ProposalList.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('Edit')) {
  code = code.replace(
    `import { Check, Trash2 } from 'lucide-react';`,
    `import { Check, Trash2, Edit } from 'lucide-react';\nimport { Link } from '@tanstack/react-router';`
  );

  code = code.replace(
    `            <ActionIcon variant="subtle" color="green" onClick={() => onCommit(proposal)} title="Commit Proposal">
              <Check size={16} />
            </ActionIcon>
          )}`,
    `            <ActionIcon variant="subtle" color="green" onClick={() => onCommit(proposal)} title="Commit Proposal">
              <Check size={16} />
            </ActionIcon>
          )}
          {proposal.status === 'Draft' && (
            <ActionIcon component={Link} to={\`/proposals/\${proposal.id}/edit\`} variant="subtle" color="blue" title="Edit Proposal">
              <Edit size={16} />
            </ActionIcon>
          )}`
  );

  fs.writeFileSync(path, code);
}

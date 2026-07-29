import fs from 'fs';

const path = 'src/app/router.tsx';
let code = fs.readFileSync(path, 'utf8');

const importStatement = `import { ProposalEditPage } from '@/features/proposal-editing/components/ProposalEditPage';`;

code = code.replace(
  `import { EnrollmentsPage } from '@/features/enrollments/components/EnrollmentsPage';`,
  `import { EnrollmentsPage } from '@/features/enrollments/components/EnrollmentsPage';\n${importStatement}`
);

const newRoute = `
const proposalEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/proposals/$proposalId/edit',
  component: ProposalEditPage,
});
`;

code = code.replace(
  `const enrollmentsRoute = createRoute({`,
  `${newRoute}\nconst enrollmentsRoute = createRoute({`
);

code = code.replace(
  `proposalsRoute,`,
  `proposalsRoute,\n  proposalEditRoute,`
);

fs.writeFileSync(path, code);

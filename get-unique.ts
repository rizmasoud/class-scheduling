import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '@/core/database/schema';

async function run() {
  const client = createClient({ url: 'file:local.db' });
  const db = drizzle(client, { schema });
  const proposals = await db.select().from(schema.schedulingProposals);
  console.log(proposals[0]);

  const classes = await db.select().from(schema.proposalClasses);
  console.log(`classes: ${classes.length}`);

  const studentsInClasses = await db.select().from(schema.proposalStudents);
  console.log(`studentsInClasses: ${studentsInClasses.length}`);

  const uniqueStudents = new Set(studentsInClasses.map(s => s.studentId));
  console.log(`Unique students in classes: ${uniqueStudents.size}`);

  const unscheduled = await db.select().from(schema.proposalUnscheduledStudents);
  console.log(`unscheduled: ${unscheduled.length}`);
  const reasonCounts = unscheduled.map(u => u.reason).reduce((acc: any, val: any) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
  console.log(`Reasons: ${JSON.stringify(reasonCounts)}`);
}
run();

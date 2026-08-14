const fs = require('fs');
let path = 'src/infrastructure/repositories/proposal.repository.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `  async findAll(): Promise<readonly SchedulingProposal[]> {
    const raw = await super.executeFindAll();
    
    const pClasses = await this.db.select().from(proposalClasses);
    const pSchedules = await this.db.select().from(proposalClassSchedules);`,
  `  async findAll(): Promise<readonly SchedulingProposal[]> {
    const raw = await super.executeFindAll();
    
    const pClasses = await this.db.select().from(proposalClasses);
    const pSchedules = await this.db.select().from(proposalClassSchedules);
    const pUnscheduled = await this.db.select().from(proposalUnscheduledStudents);`
);

code = code.replace(
  `  async findAllActive(): Promise<readonly SchedulingProposal[]> {
    const results = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.isArchived, false))
      .orderBy(desc(this.table.createdAt));
      
    const pClasses = await this.db.select().from(proposalClasses);
    const pSchedules = await this.db.select().from(proposalClassSchedules);`,
  `  async findAllActive(): Promise<readonly SchedulingProposal[]> {
    const results = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.isArchived, false))
      .orderBy(desc(this.table.createdAt));
      
    const pClasses = await this.db.select().from(proposalClasses);
    const pSchedules = await this.db.select().from(proposalClassSchedules);
    const pUnscheduled = await this.db.select().from(proposalUnscheduledStudents);`
);

fs.writeFileSync(path, code);
console.log('fixed proposal.repository.ts');

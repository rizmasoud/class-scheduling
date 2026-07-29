import { eq, and, notInArray } from 'drizzle-orm';
import { DbExecutor } from '@/core/database/types';
import { schedulingProposals, SchedulingProposal as PersistenceSchedulingProposal, InsertSchedulingProposal } from '@/core/database/schema/scheduling-proposals.schema';
import { proposalClasses } from '@/core/database/schema/proposal-classes.schema';
import { proposalClassSchedules } from '@/core/database/schema/proposal-class-schedules.schema';
import { SchedulingProposal, ProposalId } from '@/domain/models';
import { IProposalRepository } from '@/domain/repositories/i-proposal.repository';
import { ProposalMapper } from '@/infrastructure/mappers/proposal.mapper';
import { Class } from '@/domain/models';
import { ClassRepository } from './class.repository';
import { SoftDeleteRepository } from './base.repository';

export class ProposalRepository 
  extends SoftDeleteRepository<typeof schedulingProposals, PersistenceSchedulingProposal, InsertSchedulingProposal> 
  implements IProposalRepository
{
  constructor(db: DbExecutor) {
    super(db, schedulingProposals);
  }

  async findById(id: ProposalId): Promise<SchedulingProposal | null> {
    const raw = await super.executeFindById(id as string);
    if (!raw) return null;
    
    const pClasses = await this.db
      .select()
      .from(proposalClasses)
      .where(eq(proposalClasses.proposalId, id as string));
      
    // Fetch all schedules for these classes
    const pClassIds = pClasses.map(c => c.id);
    let pSchedules: (typeof proposalClassSchedules.$inferSelect)[] = [];
    if (pClassIds.length > 0) {
       // Since we can't easily use inArray if we don't import it, we can just fetch all or loop
       // But wait, we can just import inArray or loop since this is a simple implementation.
       // Let's just fetch all schedules for now, or loop.
       for (const cid of pClassIds) {
          const scheds = await this.db.select().from(proposalClassSchedules).where(eq(proposalClassSchedules.proposalClassId, cid));
          pSchedules.push(...scheds);
       }
    }
    
    const classesWithSchedules = pClasses.map(c => ({
      ...c,
      schedules: pSchedules.filter(s => s.proposalClassId === c.id)
    }));

    return ProposalMapper.toDomain(raw, classesWithSchedules);
  }

  async findMany(ids: readonly ProposalId[]): Promise<readonly SchedulingProposal[]> {
    if (ids.length === 0) return [];
    const raw = await super.executeFindMany(ids as readonly string[]);
    
    const pClasses = await this.db.select().from(proposalClasses);
    const pSchedules = await this.db.select().from(proposalClassSchedules);
    
    return raw.map(prop => {
      const propClasses = pClasses.filter(c => c.proposalId === prop.id).map(c => ({
        ...c,
        schedules: pSchedules.filter(s => s.proposalClassId === c.id)
      }));
      return ProposalMapper.toDomain(prop, propClasses);
    });
  }

  async findAll(): Promise<readonly SchedulingProposal[]> {
    const raw = await super.executeFindAll();
    
    const pClasses = await this.db.select().from(proposalClasses);
    const pSchedules = await this.db.select().from(proposalClassSchedules);
    
    return raw.map(prop => {
      const propClasses = pClasses.filter(c => c.proposalId === prop.id).map(c => ({
        ...c,
        schedules: pSchedules.filter(s => s.proposalClassId === c.id)
      }));
      return ProposalMapper.toDomain(prop, propClasses);
    });
  }

  async findAllActive(): Promise<readonly SchedulingProposal[]> {
    const results = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.isArchived, false));
      
    const pClasses = await this.db.select().from(proposalClasses);
    const pSchedules = await this.db.select().from(proposalClassSchedules);
    
    return results.map(prop => {
      const propClasses = pClasses.filter(c => c.proposalId === prop.id).map(c => ({
        ...c,
        schedules: pSchedules.filter(s => s.proposalClassId === c.id)
      }));
      return ProposalMapper.toDomain(prop, propClasses);
    });
  }

  async save(proposal: SchedulingProposal): Promise<SchedulingProposal> {
    const persistenceModel = ProposalMapper.toPersistence(proposal);

    return await this.db.transaction(async (tx) => {
      // 1. Save root entity (Proposal)
      const existing = await tx
        .select()
        .from(this.table)
        .where(eq(this.table.id, proposal.id as string))
        .limit(1)
        .then(res => res[0]);

      let result: PersistenceSchedulingProposal;
      if (existing) {
        result = await tx
          .update(this.table)
          .set(persistenceModel)
          .where(eq(this.table.id, proposal.id as string))
          .returning()
          .then(res => res[0]);
      } else {
        result = await tx
          .insert(this.table)
          .values(persistenceModel)
          .returning()
          .then(res => res[0]);
      }

      // 2. Save classes and their schedules if provided
      if (proposal.classes) {
        const currentClassIds = proposal.classes.map(c => c.id as string);
        if (currentClassIds.length > 0) {
          await tx.delete(proposalClasses).where(and(eq(proposalClasses.proposalId, proposal.id as string), notInArray(proposalClasses.id, currentClassIds)));
        } else {
          await tx.delete(proposalClasses).where(eq(proposalClasses.proposalId, proposal.id as string));
        }

        for (const pClass of proposal.classes) {
          const classPersistence = ProposalMapper.toPersistenceProposalClass(pClass);
          const existingClass = await tx
            .select()
            .from(proposalClasses)
            .where(eq(proposalClasses.id, pClass.id as string))
            .limit(1)
            .then(res => res[0]);

          if (existingClass) {
            await tx
              .update(proposalClasses)
              .set(classPersistence)
              .where(eq(proposalClasses.id, pClass.id as string));
          } else {
            await tx
              .insert(proposalClasses)
              .values(classPersistence);
          }

          if (pClass.schedules) {
            const currentSchedIds = pClass.schedules.map(s => s.id as string);
            if (currentSchedIds.length > 0) {
              await tx.delete(proposalClassSchedules).where(and(eq(proposalClassSchedules.proposalClassId, pClass.id as string), notInArray(proposalClassSchedules.id, currentSchedIds)));
            } else {
              await tx.delete(proposalClassSchedules).where(eq(proposalClassSchedules.proposalClassId, pClass.id as string));
            }

            for (const schedule of pClass.schedules) {
              const schedulePersistence = ProposalMapper.toPersistenceProposalClassSchedule(schedule);
              const existingSchedule = await tx
                .select()
                .from(proposalClassSchedules)
                .where(eq(proposalClassSchedules.id, schedule.id as string))
                .limit(1)
                .then(res => res[0]);

              if (existingSchedule) {
                await tx
                  .update(proposalClassSchedules)
                  .set(schedulePersistence)
                  .where(eq(proposalClassSchedules.id, schedule.id as string));
              } else {
                await tx
                  .insert(proposalClassSchedules)
                  .values(schedulePersistence);
              }
            }
          } else {
            await tx.delete(proposalClassSchedules).where(eq(proposalClassSchedules.proposalClassId, pClass.id as string));
          }
        }
      } else {
        // Find all class IDs for this proposal first to delete their schedules
        const classesToDelete = await tx.select().from(proposalClasses).where(eq(proposalClasses.proposalId, proposal.id as string));
        const classIdsToDelete = classesToDelete.map(c => c.id);
        if (classIdsToDelete.length > 0) {
          // Delete all schedules for all classes in this proposal
          for (const cid of classIdsToDelete) {
             await tx.delete(proposalClassSchedules).where(eq(proposalClassSchedules.proposalClassId, cid));
          }
        }
        await tx.delete(proposalClasses).where(eq(proposalClasses.proposalId, proposal.id as string));
      }
      
      const pClasses = await tx.select().from(proposalClasses).where(eq(proposalClasses.proposalId, proposal.id as string));
      const pClassIds = pClasses.map(c => c.id);
      let pSchedules: (typeof proposalClassSchedules.$inferSelect)[] = [];
      if (pClassIds.length > 0) {
        for (const cid of pClassIds) {
          const scheds = await tx.select().from(proposalClassSchedules).where(eq(proposalClassSchedules.proposalClassId, cid));
          pSchedules.push(...scheds);
        }
      }
      const classesWithSchedules = pClasses.map(c => ({
        ...c,
        schedules: pSchedules.filter(s => s.proposalClassId === c.id)
      }));
      return ProposalMapper.toDomain(result, classesWithSchedules);
    });
  }

  
  async saveWithClasses(proposal: SchedulingProposal, newClasses: readonly Class[]): Promise<void> {
    await this.db.transaction(async (tx: any) => {
      // 1. Save proposal using a transactional repository instance
      const proposalRepo = new ProposalRepository(tx);
      await proposalRepo.save(proposal);

      // 2. Save classes using a transactional repository instance
      const classRepo = new ClassRepository(tx);
      if (newClasses.length > 0) {
        await classRepo.saveMany(newClasses);
      }
    });
  }

  async findActiveDraft(): Promise<SchedulingProposal | null> {
    const raw = await this.db
      .select()
      .from(this.table)
      .where(and(eq(this.table.isArchived, false), eq(this.table.status, 'Draft' as any)))
      .limit(1)
      .then(res => res[0]);

    if (!raw) return null;
    return this.findById(raw.id as ProposalId);
  }

  async archive(id: ProposalId): Promise<void> {
    const proposal = await this.findById(id);
    if (proposal && proposal.status !== 'Draft') {
      throw new Error(`Only Draft proposals may be archived. Proposal ${id} has status '${proposal.status}'.`);
    }

    await this.db.transaction(async (tx) => {
      await tx
        .update(this.table)
        .set({ isArchived: true, status: 'Archived' as any, archivedAt: new Date().toISOString() })
        .where(eq(this.table.id, id as string));
    });
  }
}

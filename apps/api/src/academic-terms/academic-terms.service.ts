import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as schema from '../infrastructure/database/schema';

@Injectable()
export class AcademicTermsService {
  constructor(@Inject('PG_CONNECTION') private db: any) {}

  async create(data: { name: string; startDate: string; endDate: string; status: string }) {
    const [term] = await this.db.insert(schema.academicTerms).values({
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
    }).returning();
    return term;
  }

  async findAll() {
    return this.db.select().from(schema.academicTerms);
  }

  async findOne(id: string) {
    const [term] = await this.db.select().from(schema.academicTerms).where(eq(schema.academicTerms.id, id));
    if (!term) throw new NotFoundException('Academic term not found');
    return term;
  }

  async update(id: string, data: Partial<{ name: string; startDate: string; endDate: string; status: string }>) {
    const [term] = await this.db.update(schema.academicTerms)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.academicTerms.id, id))
      .returning();
    if (!term) throw new NotFoundException('Academic term not found');
    return term;
  }
}

import { Book as DomainBook, BookId } from '@/domain/models';
import { Book as PersistenceBook, InsertBook } from '@/core/database/schema/books.schema';

export const BookMapper = {
  toDomain(raw: PersistenceBook): DomainBook {
    return {
      id: raw.id as BookId,
      name: raw.name,
      level: raw.level,
      sequenceOrder: raw.sequenceOrder,
      sessionCount: raw.sessionCount,
    };
  },
  
  toPersistence(domain: DomainBook): InsertBook {
    return {
      id: domain.id as string,
      name: domain.name,
      level: domain.level,
      sequenceOrder: domain.sequenceOrder,
      sessionCount: domain.sessionCount,
    };
  }
};

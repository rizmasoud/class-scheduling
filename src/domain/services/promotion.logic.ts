import { Book, ExamResult } from '../models';

export function checkPromotionEligibility(examResult: ExamResult): boolean {
  if (examResult.resultStatus === 'Passed') {
    return true;
  }
  if (examResult.resultStatus === 'Conditional' && examResult.supervisorDecision === 'Promote') {
    return true;
  }
  return false;
}

export function findNextBook(currentBook: Book, allActiveBooks: readonly Book[]): Book {
  const sortedBooks = [...allActiveBooks].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  const nextBook = sortedBooks.find(b => b.sequenceOrder > currentBook.sequenceOrder);
  
  if (!nextBook) {
    throw new Error('No next book available for promotion.');
  }
  
  return nextBook;
}

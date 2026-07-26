import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getContainer } from '@/app/container';
import { CreateBookDTO } from '@/application/use-cases/books/create-book.use-case';
import { UpdateBookDTO } from '@/application/use-cases/books/update-book.use-case';
import { BookId } from '@/domain/models';

export const BOOKS_QUERY_KEY = ['books', 'active'];

export const useActiveBooks = () => {
  return useQuery({
    queryKey: BOOKS_QUERY_KEY,
    queryFn: () => getContainer().getActiveBooksUseCase.execute(),
  });
};

export const useCreateBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateBookDTO) => getContainer().createBookUseCase.execute(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKS_QUERY_KEY });
    },
  });
};

export const useUpdateBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateBookDTO) => getContainer().updateBookUseCase.execute(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKS_QUERY_KEY });
    },
  });
};

export const useArchiveBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: BookId) => getContainer().archiveBookUseCase.execute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKS_QUERY_KEY });
    },
  });
};

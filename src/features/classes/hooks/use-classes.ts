import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getContainer } from '@/app/container';
import { CreateClassDTO } from '@/application/use-cases/classes/create-class.use-case';
import { UpdateClassDTO } from '@/application/use-cases/classes/update-class.use-case';
import { ClassId } from '@/domain/models';

export const CLASSES_QUERY_KEY = ['classes', 'active'];

export const useActiveClasses = () => {
  return useQuery({
    queryKey: CLASSES_QUERY_KEY,
    queryFn: () => getContainer().getActiveClassesUseCase.execute(),
  });
};

export const useCreateClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateClassDTO) => getContainer().createClassUseCase.execute(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLASSES_QUERY_KEY });
    },
  });
};

export const useUpdateClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateClassDTO) => getContainer().updateClassUseCase.execute(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLASSES_QUERY_KEY });
    },
  });
};

export const useArchiveClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: ClassId) => getContainer().archiveClassUseCase.execute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLASSES_QUERY_KEY });
    },
  });
};

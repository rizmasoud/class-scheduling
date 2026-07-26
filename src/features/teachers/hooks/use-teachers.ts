import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getContainer } from '@/app/container';
import { CreateTeacherDTO } from '@/application/use-cases/teachers/create-teacher.use-case';
import { UpdateTeacherDTO } from '@/application/use-cases/teachers/update-teacher.use-case';
import { TeacherId } from '@/domain/models';

export const TEACHERS_QUERY_KEY = ['teachers', 'active'];

export const useActiveTeachers = () => {
  return useQuery({
    queryKey: TEACHERS_QUERY_KEY,
    queryFn: () => getContainer().getActiveTeachersUseCase.execute(),
  });
};

export const useCreateTeacher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTeacherDTO) => getContainer().createTeacherUseCase.execute(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEACHERS_QUERY_KEY });
    },
  });
};

export const useUpdateTeacher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateTeacherDTO) => getContainer().updateTeacherUseCase.execute(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEACHERS_QUERY_KEY });
    },
  });
};

export const useArchiveTeacher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: TeacherId) => getContainer().archiveTeacherUseCase.execute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEACHERS_QUERY_KEY });
    },
  });
};

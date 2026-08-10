import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getContainer } from '@/app/container';
import { CreateStudentDTO } from '@/application/use-cases/students/create-student.use-case';
import { UpdateStudentDTO } from '@/application/use-cases/students/update-student.use-case';
import { StudentId } from '@/domain/models';

export const STUDENTS_QUERY_KEY = ['students', 'active'];

export const useActiveStudents = () => {
  return useQuery({
    queryKey: STUDENTS_QUERY_KEY,
    queryFn: () => getContainer().getActiveStudentsUseCase.execute(),
  });
};

export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateStudentDTO) => getContainer().createStudentUseCase.execute(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STUDENTS_QUERY_KEY });
    },
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateStudentDTO) => getContainer().updateStudentUseCase.execute(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STUDENTS_QUERY_KEY });
    },
  });
};

export const useArchiveStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: StudentId) => getContainer().archiveStudentUseCase.execute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STUDENTS_QUERY_KEY });
    },
  });
};

import { PromoteStudentDTO } from '@/application/use-cases/students/promote-student.use-case';

export const usePromoteStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: PromoteStudentDTO) => getContainer().promoteStudentUseCase.execute(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STUDENTS_QUERY_KEY });
      // Might want to invalidate enrollments/classes too
      queryClient.invalidateQueries({ queryKey: ['classes', 'active'] });
    },
  });
};

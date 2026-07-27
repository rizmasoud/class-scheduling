import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getContainer } from '@/app/container';
import { EnrollStudentDTO } from '@/application/use-cases/enrollments/enroll-student.use-case';
import { UnenrollStudentDTO } from '@/application/use-cases/enrollments/unenroll-student.use-case';
import { MoveStudentBetweenClassesDTO } from '@/application/use-cases/enrollments/move-student-between-classes.use-case';
import { CLASSES_QUERY_KEY } from '@/features/classes/hooks/use-classes';
import { STUDENTS_QUERY_KEY } from '@/features/students/hooks/use-students';

export const useEnrollStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: EnrollStudentDTO) => getContainer().enrollStudentUseCase.execute(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLASSES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STUDENTS_QUERY_KEY });
    },
  });
};

export const useUnenrollStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UnenrollStudentDTO) => getContainer().unenrollStudentUseCase.execute(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLASSES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STUDENTS_QUERY_KEY });
    },
  });
};

export const useMoveStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: MoveStudentBetweenClassesDTO) => getContainer().moveStudentBetweenClassesUseCase.execute(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLASSES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STUDENTS_QUERY_KEY });
    },
  });
};

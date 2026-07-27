import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getContainer } from '@/app/container';
import { CreateExamDTO } from '@/application/use-cases/exams/create-exam.use-case';
import { UpdateExamDTO } from '@/application/use-cases/exams/update-exam.use-case';

export const EXAMS_QUERY_KEY = ['exams', 'all'];

export const useAllExams = () => {
  return useQuery({
    queryKey: EXAMS_QUERY_KEY,
    queryFn: () => getContainer().getAllExamsUseCase.execute(),
  });
};

export const useCreateExam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateExamDTO) => getContainer().createExamUseCase.execute(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXAMS_QUERY_KEY });
    },
  });
};

export const useUpdateExam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateExamDTO) => getContainer().updateExamUseCase.execute(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXAMS_QUERY_KEY });
    },
  });
};

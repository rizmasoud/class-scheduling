import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getContainer } from '@/app/container';
import { ProposalId, ProposalClassId, StudentId, TeacherId } from '@/domain/models';
import { defaultSchedulingConfig } from '@/config/scheduling.config';
import { PROPOSALS_QUERY_KEY } from '@/features/proposals/hooks/use-proposals';
import { notifications } from '@mantine/notifications';

export const PROPOSAL_DETAIL_QUERY_KEY = (id: string) => ['proposal', id];

export const useProposal = (id: ProposalId) => {
  return useQuery({
    queryKey: PROPOSAL_DETAIL_QUERY_KEY(id),
    queryFn: () => getContainer().getProposalByIdUseCase.execute(id),
  });
};

const notifyError = (error: any) => {
  notifications.show({
    title: 'Validation Error',
    message: error.message || 'The edit violates scheduling constraints.',
    color: 'red',
  });
};

const notifySuccess = (message: string) => {
  notifications.show({
    title: 'Success',
    message,
    color: 'green',
  });
};

export const useMoveStudent = (proposalId: ProposalId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, fromClassId, toClassId }: { studentId: StudentId, fromClassId: ProposalClassId, toClassId: ProposalClassId }) => 
      getContainer().moveStudentBetweenProposalClassesUseCase.execute({ proposalId, studentId, fromClassId, toClassId, config: defaultSchedulingConfig }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROPOSAL_DETAIL_QUERY_KEY(proposalId) });
      queryClient.invalidateQueries({ queryKey: PROPOSALS_QUERY_KEY });
      notifySuccess('Student moved successfully');
    },
    onError: notifyError
  });
};

export const useAddStudent = (proposalId: ProposalId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, classId }: { studentId: StudentId, classId: ProposalClassId }) => 
      getContainer().addStudentToProposalClassUseCase.execute({ proposalId, studentId, classId, config: defaultSchedulingConfig }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROPOSAL_DETAIL_QUERY_KEY(proposalId) });
      notifySuccess('Student added successfully');
    },
    onError: notifyError
  });
};

export const useRemoveStudent = (proposalId: ProposalId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, classId }: { studentId: StudentId, classId: ProposalClassId }) => 
      getContainer().removeStudentFromProposalClassUseCase.execute({ proposalId, studentId, classId, config: defaultSchedulingConfig }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROPOSAL_DETAIL_QUERY_KEY(proposalId) });
      notifySuccess('Student removed successfully');
    },
    onError: notifyError
  });
};

export const useSwapStudents = (proposalId: ProposalId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId1, classId1, studentId2, classId2 }: { studentId1: StudentId, classId1: ProposalClassId, studentId2: StudentId, classId2: ProposalClassId }) => 
      getContainer().swapStudentsBetweenProposalClassesUseCase.execute({ proposalId, studentId1, classId1, studentId2, classId2, config: defaultSchedulingConfig }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROPOSAL_DETAIL_QUERY_KEY(proposalId) });
      notifySuccess('Students swapped successfully');
    },
    onError: notifyError
  });
};

export const useAssignTeacher = (proposalId: ProposalId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teacherId, classId }: { teacherId: TeacherId, classId: ProposalClassId }) => 
      getContainer().assignTeacherToProposalClassUseCase.execute({ proposalId, teacherId, classId, config: defaultSchedulingConfig }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROPOSAL_DETAIL_QUERY_KEY(proposalId) });
      notifySuccess('Teacher assigned successfully');
    },
    onError: notifyError
  });
};

export const useChangeSchedule = (proposalId: ProposalId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, weekDay, startTime, endTime }: { classId: ProposalClassId, weekDay: string, startTime: string, endTime: string }) => 
      getContainer().changeProposalClassScheduleUseCase.execute({ proposalId, classId, weekDay, startTime, endTime, config: defaultSchedulingConfig }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROPOSAL_DETAIL_QUERY_KEY(proposalId) });
      notifySuccess('Schedule updated successfully');
    },
    onError: notifyError
  });
};

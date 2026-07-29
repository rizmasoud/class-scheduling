import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getContainer } from '@/app/container';
import { ProposalId } from '@/domain/models';

export const PROPOSALS_REVIEW_QUERY_KEY = ['proposals', 'active'];

export const useActiveProposals = () => {
  return useQuery({
    queryKey: PROPOSALS_REVIEW_QUERY_KEY,
    queryFn: () => getContainer().getActiveProposalsUseCase.execute(),
  });
};

export const useCommitProposal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: ProposalId) => getContainer().commitProposalUseCase.execute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROPOSALS_REVIEW_QUERY_KEY });
    },
  });
};

export const useArchiveProposal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: ProposalId) => getContainer().archiveProposalUseCase.execute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROPOSALS_REVIEW_QUERY_KEY });
    },
  });
};

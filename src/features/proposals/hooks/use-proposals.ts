import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getContainer } from '@/app/container';
import { CreateProposalDTO } from '@/application/use-cases/proposals/create-proposal.use-case';
import { ProposalId } from '@/domain/models';

export const PROPOSALS_QUERY_KEY = ['proposals', 'active'];

export const useActiveProposals = () => {
  return useQuery({
    queryKey: PROPOSALS_QUERY_KEY,
    queryFn: () => getContainer().getActiveProposalsUseCase.execute(),
  });
};

export const useCreateProposal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateProposalDTO) => getContainer().createProposalUseCase.execute(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROPOSALS_QUERY_KEY });
    },
  });
};

export const useCommitProposal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: ProposalId) => getContainer().commitProposalUseCase.execute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROPOSALS_QUERY_KEY });
    },
  });
};

export const useArchiveProposal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: ProposalId) => getContainer().archiveProposalUseCase.execute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROPOSALS_QUERY_KEY });
    },
  });
};

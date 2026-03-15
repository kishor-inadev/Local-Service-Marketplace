import { useOptimisticMutation } from './useOptimisticMutation';
import { proposalService, Proposal } from '@/services/proposal-service';
import toast from 'react-hot-toast';

interface ProposalActionVariables {
  proposalId: string;
  action: 'accept' | 'reject';
  requestId: string;
}

/**
 * Hook for optimistic proposal accept/reject
 * Immediately updates UI, rollback on error
 */
export function useProposalAction() {
  return useOptimisticMutation<Proposal, ProposalActionVariables>({
    queryKey: ['proposals'],
    mutationFn: async ({ proposalId, action }) => {
      if (action === 'accept') {
        return await proposalService.acceptProposal(proposalId);
      } else {
        return await proposalService.rejectProposal(proposalId);
      }
    },
    updateFn: (oldData: Proposal[], { proposalId, action }) => {
      if (!oldData) return [];

      return oldData.map((proposal) =>
        proposal.id === proposalId
          ? { ...proposal, status: action === 'accept' ? 'accepted' : 'rejected' }
          : proposal,
      );
    },
    successMessage: 'Proposal updated successfully',
    errorMessage: 'Failed to update proposal',
    onSuccess: (data, variables) => {
      // Show specific success message based on action
      const message = `Proposal ${variables.action === 'accept' ? 'accepted' : 'rejected'} successfully`;
      toast.success(message);
    },
  });
}

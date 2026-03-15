import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface OptimisticUpdateConfig<TData, TVariables> {
  queryKey: any[];
  mutationFn: (variables: TVariables) => Promise<TData>;
  updateFn: (oldData: any, variables: TVariables) => any;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: any, variables: TVariables) => void;
}

/**
 * Custom hook for optimistic UI updates
 * Immediately updates the UI, then rollback on error
 */
export function useOptimisticMutation<TData = unknown, TVariables = unknown>({
  queryKey,
  mutationFn,
  updateFn,
  successMessage,
  errorMessage = 'Operation failed',
  onSuccess,
  onError,
}: OptimisticUpdateConfig<TData, TVariables>) {
  const queryClient = useQueryClient();
  const [isOptimistic, setIsOptimistic] = useState(false);

  return useMutation<TData, Error, TVariables>({
    mutationFn,
    onMutate: async (variables) => {
      setIsOptimistic(true);

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot current value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update cache
      queryClient.setQueryData(queryKey, (old: any) => updateFn(old, variables));

      // Return context with snapshot
      return { previousData };
    },
    onError: (error, variables, context: any) => {
      setIsOptimistic(false);

      // Rollback to previous state
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }

      // Show error toast
      const message = error?.message || errorMessage;
      toast.error(message);

      // Call custom error handler
      if (onError) {
        onError(error, variables);
      }
    },
    onSuccess: (data, variables) => {
      setIsOptimistic(false);

      // Show success toast
      if (successMessage) {
        toast.success(successMessage);
      }

      // Call custom success handler
      if (onSuccess) {
        onSuccess(data, variables);
      }
    },
    onSettled: () => {
      setIsOptimistic(false);
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

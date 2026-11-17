import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataReviewService } from '../services/dataReviewService';
import { SignoffRequest } from '../types';

export function useDataReviewPipeline() {
  return useQuery({
    queryKey: ['data-review-pipeline'],
    queryFn: () => dataReviewService.getPipeline(),
  });
}

export function useDataReviewHistory() {
  return useQuery({
    queryKey: ['data-review-history'],
    queryFn: () => dataReviewService.getHistory(),
  });
}

export function useDataReviewReadiness() {
  return useQuery({
    queryKey: ['data-review-readiness'],
    queryFn: () => dataReviewService.getReadiness(),
  });
}

export function useDataReviewCalendarFeeds() {
  return useQuery({
    queryKey: ['data-review-calendar'],
    queryFn: () => dataReviewService.getCalendarFeeds(),
  });
}

export function useDataReviewMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['data-review-pipeline'] });
    queryClient.invalidateQueries({ queryKey: ['data-review-history'] });
    queryClient.invalidateQueries({ queryKey: ['data-review-readiness'] });
    queryClient.invalidateQueries({ queryKey: ['data-review-calendar'] });
  };

  const loadFeedMutation = useMutation({
    mutationFn: (id: string) => dataReviewService.loadFeed(id),
    onSuccess: () => invalidateAll(),
  });

  const updateReadinessMutation = useMutation({
    mutationFn: (patch: { innovationReviewed?: boolean; comboPacksReviewed?: boolean }) =>
      dataReviewService.updateReadiness(patch),
    onSuccess: () => invalidateAll(),
  });

  const signoffMutation = useMutation({
    mutationFn: (data: SignoffRequest) => dataReviewService.signoff(data),
    onSuccess: () => invalidateAll(),
  });

  const reopenMutation = useMutation({
    mutationFn: () => dataReviewService.reopen(),
    onSuccess: () => invalidateAll(),
  });

  return {
    loadFeed: loadFeedMutation.mutateAsync,
    isLoadFeedPending: loadFeedMutation.isPending,
    updateReadiness: updateReadinessMutation.mutateAsync,
    isUpdateReadinessPending: updateReadinessMutation.isPending,
    signoff: signoffMutation.mutateAsync,
    isSignoffPending: signoffMutation.isPending,
    reopen: reopenMutation.mutateAsync,
    isReopenPending: reopenMutation.isPending,
  };
}


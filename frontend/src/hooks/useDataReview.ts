import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataReviewService } from '../services/dataReviewService';
import {
  ComboPack,
  InnovationProduct,
  SignoffRequest,
  TransactionReviewQueryParams,
} from '../types';

export function useDataReviewTransactions(params: TransactionReviewQueryParams = {}) {
  return useQuery({
    queryKey: ['data-review-transactions', params],
    queryFn: () => dataReviewService.getTransactions(params),
  });
}

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

export function useDataReviewValidation() {
  return useQuery({
    queryKey: ['data-review-validation'],
    queryFn: () => dataReviewService.getValidationData(),
  });
}

export function useDataReviewInnovations() {
  return useQuery({
    queryKey: ['data-review-innovations'],
    queryFn: () => dataReviewService.getInnovations(),
  });
}

export function useDataReviewCombos() {
  return useQuery({
    queryKey: ['data-review-combos'],
    queryFn: () => dataReviewService.getCombos(),
  });
}

export function useDataReviewMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['data-review-pipeline'] });
    queryClient.invalidateQueries({ queryKey: ['data-review-history'] });
    queryClient.invalidateQueries({ queryKey: ['data-review-readiness'] });
    queryClient.invalidateQueries({ queryKey: ['data-review-calendar'] });
    queryClient.invalidateQueries({ queryKey: ['data-review-validation'] });
    queryClient.invalidateQueries({ queryKey: ['data-review-innovations'] });
    queryClient.invalidateQueries({ queryKey: ['data-review-combos'] });
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

  const fixMappingGapMutation = useMutation({
    mutationFn: ({ id, fixType }: { id: string; fixType?: 'master' | 'transaction' }) =>
      dataReviewService.fixMappingGap(id, fixType),
    onSuccess: () => invalidateAll(),
  });

  const replaceNullValueMutation = useMutation({
    mutationFn: ({ id, method }: { id: string; method: 'zero' | 'mean' | 'median' | 'mode' }) =>
      dataReviewService.replaceNullValue(id, method),
    onSuccess: () => invalidateAll(),
  });

  const rerunMissingIntegrationMutation = useMutation({
    mutationFn: () => dataReviewService.rerunMissingIntegration(),
    onSuccess: () => invalidateAll(),
  });

  const addInnovationMutation = useMutation({
    mutationFn: (product: Omit<InnovationProduct, 'id'>) =>
      dataReviewService.addInnovation(product),
    onSuccess: () => invalidateAll(),
  });

  const deleteInnovationMutation = useMutation({
    mutationFn: (id: string) => dataReviewService.deleteInnovation(id),
    onSuccess: () => invalidateAll(),
  });

  const createComboMutation = useMutation({
    mutationFn: (combo: Omit<ComboPack, 'id'>) => dataReviewService.createCombo(combo),
    onSuccess: () => invalidateAll(),
  });

  const updateComboMutation = useMutation({
    mutationFn: ({ id, combo }: { id: string; combo: Partial<ComboPack> }) =>
      dataReviewService.updateCombo(id, combo),
    onSuccess: () => invalidateAll(),
  });

  const deleteComboMutation = useMutation({
    mutationFn: (id: string) => dataReviewService.deleteCombo(id),
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
    fixMappingGap: fixMappingGapMutation.mutateAsync,
    isFixMappingGapPending: fixMappingGapMutation.isPending,
    replaceNullValue: replaceNullValueMutation.mutateAsync,
    isReplaceNullValuePending: replaceNullValueMutation.isPending,
    rerunMissingIntegration: rerunMissingIntegrationMutation.mutateAsync,
    isRerunPending: rerunMissingIntegrationMutation.isPending,
    addInnovation: addInnovationMutation.mutateAsync,
    isAddInnovationPending: addInnovationMutation.isPending,
    deleteInnovation: deleteInnovationMutation.mutateAsync,
    createCombo: createComboMutation.mutateAsync,
    updateCombo: updateComboMutation.mutateAsync,
    deleteCombo: deleteComboMutation.mutateAsync,
  };
}


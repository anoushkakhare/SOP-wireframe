import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scenarioService } from '../services/scenarioService';
import { useScenarioStore } from '../store/scenarioStore';
import { Scenario } from '../types';

export function useScenarios() {
  const queryClient = useQueryClient();
  const { setScenarios, setActiveScenario, activeScenario } = useScenarioStore();

  const query = useQuery({
    queryKey: ['scenarios'],
    queryFn: async () => {
      const data = await scenarioService.list();
      setScenarios(data);
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => scenarioService.create(name),
    onSuccess: (newScenario: Scenario) => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      setActiveScenario(newScenario);
    },
  });

  const commitMutation = useMutation({
    mutationFn: (id: string) => scenarioService.commit(id),
    onSuccess: (committed: Scenario) => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      setActiveScenario(committed);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => scenarioService.delete(id),
    onSuccess: (_resp, id) => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      if (activeScenario?.id === id) {
        setActiveScenario(null);
      }
    },
  });

  return {
    scenarios: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createScenario: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
    commitScenario: commitMutation.mutateAsync,
    isCommitting: commitMutation.isPending,
    deleteScenario: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}


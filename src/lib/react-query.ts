import { QueryClient } from '@tanstack/react-query';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh for 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes - cache garbage collection time (formerly cacheTime)
      refetchOnWindowFocus: false, // Don't refetch on window focus for better UX
      retry: 1, // Retry failed requests once
      refetchOnMount: true, // Refetch on mount if data is stale
    },
    mutations: {
      retry: 1,
    },
  },
});


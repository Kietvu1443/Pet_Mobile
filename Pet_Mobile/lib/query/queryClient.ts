import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes stale time
      gcTime: 30 * 60 * 1000, // 30 minutes garbage collection time
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

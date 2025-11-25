import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAllClientsQuery, useCreateClientMutation } from '@/hooks/useClients';
import type { ReactNode } from 'react';

global.fetch = vi.fn();

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useClients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAllClientsQuery', () => {
    it('should fetch all clients successfully', async () => {
      const mockClients = [
        {
          id: '1',
          name: 'Cliente 1',
          contactInfo: '999888777',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Cliente 2',
          contactInfo: '999888666',
          createdAt: new Date().toISOString(),
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockClients,
      });

      const { result } = renderHook(() => useAllClientsQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockClients);
      expect(result.current.data).toHaveLength(2);
    });

    it('should handle fetch error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error',
      });

      const { result } = renderHook(() => useAllClientsQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useCreateClientMutation', () => {
    it('should create client successfully', async () => {
      const newClient = {
        id: '3',
        name: 'Nuevo Cliente',
        contactInfo: '999111222',
        createdAt: new Date().toISOString(),
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => newClient,
      });

      const { result } = renderHook(() => useCreateClientMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        name: 'Nuevo Cliente',
        contactInfo: '999111222',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(newClient);
    });

    it('should handle validation error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Nombre es requerido' }),
      });

      const { result } = renderHook(() => useCreateClientMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        name: '',
        contactInfo: '999111222',
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });
});

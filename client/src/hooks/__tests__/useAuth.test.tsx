import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthQuery, useLoginMutation, useLogoutMutation } from '@/hooks/useAuth';
import type { ReactNode } from 'react';

// Mock fetch
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

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAuthQuery', () => {
    it('should fetch user profile successfully', async () => {
      const mockProfile = {
        id: '123',
        username: 'testuser',
        createdAt: new Date().toISOString(),
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      });

      const { result } = renderHook(() => useAuthQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockProfile);
    });

    it('should handle authentication error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Not authenticated',
      });

      const { result } = renderHook(() => useAuthQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useLoginMutation', () => {
    it('should login successfully', async () => {
      const mockProfile = {
        id: '123',
        username: 'admin',
        createdAt: new Date().toISOString(),
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      });

      const { result } = renderHook(() => useLoginMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ username: 'admin', password: 'admin123' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockProfile);
    });

    it('should handle login error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid credentials' }),
      });

      const { result } = renderHook(() => useLoginMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ username: 'wrong', password: 'wrong' });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });
});

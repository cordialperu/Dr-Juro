import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientsPage } from '@/components/ClientsPage';

global.fetch = vi.fn();

const mockClients = [
  {
    id: '1',
    name: 'Juan Pérez',
    contactInfo: '999888777',
    createdAt: new Date('2025-01-01').toISOString(),
  },
  {
    id: '2',
    name: 'María García',
    contactInfo: '999888666',
    createdAt: new Date('2025-01-02').toISOString(),
  },
];

function renderWithClient(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
}

describe('ClientsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render clients list', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockClients,
    });

    renderWithClient(<ClientsPage />);

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('María García')).toBeInTheDocument();
    });
  });

  it('should show loading state', () => {
    (global.fetch as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithClient(<ClientsPage />);

    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('should show empty state when no clients', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    renderWithClient(<ClientsPage />);

    await waitFor(() => {
      expect(screen.getByText(/no hay clientes/i)).toBeInTheDocument();
    });
  });

  it('should open create client dialog', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    renderWithClient(<ClientsPage />);

    const createButton = await screen.findByRole('button', { name: /nuevo cliente/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});

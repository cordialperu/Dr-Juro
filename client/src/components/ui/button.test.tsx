import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('debe renderizar correctamente', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('debe aplicar variant correctamente', () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-destructive');
  });

  it('debe estar deshabilitado cuando disabled=true', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByText('Disabled');
    expect(button).toBeDisabled();
  });

  it('debe aplicar size correctamente', () => {
    const { container } = render(<Button size="sm">Small</Button>);
    const button = container.querySelector('button');
    // Button usa min-h en lugar de h para tamaños
    expect(button).toHaveClass('min-h-8');
  });
});

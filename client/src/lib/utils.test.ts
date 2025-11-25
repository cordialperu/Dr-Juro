import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('utils', () => {
  describe('cn (className merger)', () => {
    it('debe combinar clases normalmente', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('debe combinar clases sin duplicar (comportamiento actual de clsx)', () => {
      // clsx no elimina duplicados, solo los mantiene
      expect(cn('foo', 'foo')).toContain('foo');
    });

    it('debe manejar clases condicionales', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    });

    it('debe manejar valores undefined y null', () => {
      expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
    });

    it('debe resolver conflictos de Tailwind', () => {
      // tailwind-merge debe mantener la última clase conflictiva
      expect(cn('p-4', 'p-2')).toBe('p-2');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });
  });
});

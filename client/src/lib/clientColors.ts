/**
 * Sistema de colores por cliente para identificación visual inmediata.
 * Genera colores consistentes basados en el ID del cliente.
 */

// Paleta de colores vibrantes para UI (evitando el azul por defecto)
const COLOR_PALETTE = [
  { primary: 'rgb(239, 68, 68)', light: 'rgb(254, 202, 202)', dark: 'rgb(185, 28, 28)' }, // Rojo
  { primary: 'rgb(249, 115, 22)', light: 'rgb(254, 215, 170)', dark: 'rgb(194, 65, 12)' }, // Naranja
  { primary: 'rgb(234, 179, 8)', light: 'rgb(254, 240, 138)', dark: 'rgb(161, 98, 7)' }, // Amarillo
  { primary: 'rgb(34, 197, 94)', light: 'rgb(187, 247, 208)', dark: 'rgb(21, 128, 61)' }, // Verde
  { primary: 'rgb(20, 184, 166)', light: 'rgb(153, 246, 228)', dark: 'rgb(15, 118, 110)' }, // Teal
  { primary: 'rgb(59, 130, 246)', light: 'rgb(191, 219, 254)', dark: 'rgb(29, 78, 216)' }, // Azul (original)
  { primary: 'rgb(99, 102, 241)', light: 'rgb(199, 210, 254)', dark: 'rgb(67, 56, 202)' }, // Índigo
  { primary: 'rgb(168, 85, 247)', light: 'rgb(233, 213, 255)', dark: 'rgb(107, 33, 168)' }, // Púrpura
  { primary: 'rgb(236, 72, 153)', light: 'rgb(252, 231, 243)', dark: 'rgb(190, 24, 93)' }, // Rosa
  { primary: 'rgb(244, 63, 94)', light: 'rgb(254, 205, 211)', dark: 'rgb(190, 18, 60)' }, // Rosa intenso
];

/**
 * Genera hash simple de string para índice de color consistente
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Obtiene el color asignado a un cliente basado en su ID
 */
export function getClientColor(clientId: string | number) {
  const id = String(clientId);
  const index = hashString(id) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
}

/**
 * Obtiene estilos CSS personalizados para el cliente actual
 */
export function getClientColorStyles(clientId: string | number) {
  const colors = getClientColor(clientId);
  return {
    '--client-primary': colors.primary,
    '--client-light': colors.light,
    '--client-dark': colors.dark,
  } as React.CSSProperties;
}

/**
 * Clases de Tailwind para aplicar colores del cliente (fallback si no se usan variables CSS)
 */
export function getClientColorClasses(clientId: string | number) {
  const colors = getClientColor(clientId);
  return {
    primary: colors.primary,
    light: colors.light,
    dark: colors.dark,
    bgPrimary: `bg-[${colors.primary}]`,
    textPrimary: `text-[${colors.primary}]`,
    borderPrimary: `border-[${colors.primary}]`,
    bgLight: `bg-[${colors.light}]`,
    textDark: `text-[${colors.dark}]`,
  };
}

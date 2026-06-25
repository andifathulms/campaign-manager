/**
 * Shared chart palette aligned to the "Civic Gold" design tokens.
 * Use CHART_SERIES for generic multi-series charts. Platform-brand colors
 * (Meta/TikTok/Google) are mandated by the platforms — keep those as-is.
 */
export const CHART = {
  primary: '#2456E6', // ballot blue (token --primary)
  gold: '#F5A524', // victory gold (token --gold)
  teal: '#0EA5A4',
  green: '#16A34A',
  pink: '#EC4899',
  slate: '#64748B',
} as const;

/** Ordered palette for charts with multiple unlabeled series. */
export const CHART_SERIES = [
  CHART.primary,
  CHART.gold,
  CHART.teal,
  CHART.green,
  CHART.pink,
];

/** Platform-brand colors — mandated, do not theme. */
export const PLATFORM_COLORS = {
  meta: '#3B82F6',
  tiktok: '#EC4899',
  google: '#22C55E',
} as const;

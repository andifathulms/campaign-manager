/**
 * Shared chart palette aligned to the "Sovereign Navy & Gold" design tokens.
 * Use CHART_SERIES for generic multi-series charts. Platform-brand colors
 * (Meta/TikTok/Google) are mandated by the platforms — keep those as-is.
 */
export const CHART = {
  primary: '#0A1A3F', // navy (token --primary)
  gold: '#C9A24B', // antique gold (token --gold)
  goldSoft: '#E3C77E',
  navyMid: '#1E3A6E',
  emerald: '#1FA37A',
  slate: '#64748B',
} as const;

/** Ordered palette for charts with multiple unlabeled series. */
export const CHART_SERIES = [
  CHART.primary,
  CHART.gold,
  CHART.navyMid,
  CHART.emerald,
  CHART.goldSoft,
];

/** Platform-brand colors — mandated, do not theme. */
export const PLATFORM_COLORS = {
  meta: '#3B82F6',
  tiktok: '#EC4899',
  google: '#22C55E',
} as const;

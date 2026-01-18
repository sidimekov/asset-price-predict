export const AnalyticsEvent = {
  SEARCH_ASSET: 'search_asset',
  SELECT_ASSET: 'select_asset',
  PREDICT_START: 'predict_start',
  PREDICT_SUCCESS: 'predict_success',
  PREDICT_ERROR: 'predict_error',
  OPEN_FORECAST_FROM_HISTORY: 'open_forecast_from_history',
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

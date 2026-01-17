CREATE TABLE IF NOT EXISTS forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  timeframe text NOT NULL,
  horizon text NOT NULL,
  series jsonb NOT NULL,
  metrics jsonb,
  factors jsonb,
  provider text,
  model text,
  "window" int,
  params jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_forecasts_user_created_at
  ON forecasts (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_forecasts_symbol_timeframe_horizon
  ON forecasts (symbol, timeframe, horizon);

CREATE INDEX IF NOT EXISTS idx_forecasts_provider
  ON forecasts (provider);

DROP TRIGGER IF EXISTS set_forecasts_updated_at ON forecasts;
CREATE TRIGGER set_forecasts_updated_at
  BEFORE UPDATE ON forecasts
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

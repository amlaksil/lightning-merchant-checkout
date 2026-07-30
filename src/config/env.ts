const missingEnvMessage = (name: string) =>
  `Missing required environment variable: ${name}`;

const invalidEnvMessage = (name: string) =>
  `Environment variable ${name} must be a positive number`;

const requireEnv = (name: string, value?: string) => {
  if (!value) {
    throw new Error(missingEnvMessage(name));
  }

  return value;
};

const readPositiveNumber = (name: string, value?: string) => {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(invalidEnvMessage(name));
  }

  return parsed;
};

export const hasSupabasePublicConfig = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

export const hasSupabaseServerConfig = () =>
  Boolean(hasSupabasePublicConfig() && process.env.SUPABASE_SERVICE_ROLE_KEY);

export const getSupabasePublicConfig = () => ({
  url: requireEnv(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL
  ),
  anonKey: requireEnv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ),
});

export const getSupabaseServerConfig = () => ({
  ...getSupabasePublicConfig(),
  serviceRoleKey: requireEnv(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ),
});

export const getCoinbaseExchangeRateUrl = () =>
  process.env.COINBASE_EXCHANGE_RATE_URL ||
  "https://api.coinbase.com/v2/exchange-rates?currency=BTC";

export const getFxCacheTtlSeconds = () =>
  readPositiveNumber(
    "FX_CACHE_TTL_SECONDS",
    process.env.FX_CACHE_TTL_SECONDS
  ) ?? 300;

export const getManualEtbPerBtcRate = () =>
  readPositiveNumber("MANUAL_ETB_PER_BTC", process.env.MANUAL_ETB_PER_BTC);

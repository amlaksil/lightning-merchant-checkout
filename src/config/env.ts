const missingEnvMessage = (name: string) =>
  `Missing required environment variable: ${name}`;

const requireEnv = (name: string, value?: string) => {
  if (!value) {
    throw new Error(missingEnvMessage(name));
  }

  return value;
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

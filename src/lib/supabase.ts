import { createClient } from "@supabase/supabase-js";

import {
  getSupabasePublicConfig,
  getSupabaseServerConfig,
  hasSupabasePublicConfig,
  hasSupabaseServerConfig,
} from "@/config/env";

export const isSupabasePublicConfigured = hasSupabasePublicConfig;
export const isSupabaseServerConfigured = hasSupabaseServerConfig;

export const createSupabaseBrowserClient = () => {
  const { url, anonKey } = getSupabasePublicConfig();

  return createClient(url, anonKey);
};

export const createSupabaseServerClient = () => {
  const { url, serviceRoleKey } = getSupabaseServerConfig();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

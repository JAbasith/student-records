"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "./config";

export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

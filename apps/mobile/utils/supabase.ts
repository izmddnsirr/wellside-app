import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, processLock } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const isServer = typeof window === "undefined";
const storage = isServer
  ? {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {},
    }
  : AsyncStorage;

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase configuration: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY are required."
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: !isServer,
      detectSessionInUrl: false,
      lock: processLock,
    },
  }
);

// ============================================
// MOCK MODE — no Supabase account needed
// Switch USE_MOCK to false and fill in real
// credentials when ready to go live.
// ============================================

import { mockSupabase } from './mockData';

const USE_MOCK = true;

let supabase;

if (USE_MOCK) {
  supabase = mockSupabase;
} else {
  // Real Supabase - dynamic import to avoid loading when not needed
  const { createClient } = require('@supabase/supabase-js');
  require('react-native-url-polyfill/auto');
  const SecureStore = require('expo-secure-store');

  const ExpoSecureStoreAdapter = {
    getItem: (key) => SecureStore.getItemAsync(key),
    setItem: (key, value) => SecureStore.setItemAsync(key, value),
    removeItem: (key) => SecureStore.deleteItemAsync(key),
  };

  const SUPABASE_URL = 'https://evnnlhgdwvrojigvvneg.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2bm5saGdkd3Zyb2ppZ3Z2bmVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNDI5MDQsImV4cCI6MjA4NTgxODkwNH0.KoHN-I7o8mPYKDDDVrcXlFH9MHKw93JVCzTLzlSfVOQ';

  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export { supabase };

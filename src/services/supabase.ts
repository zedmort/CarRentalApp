import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const SUPABASE_URL = 'https://yxtoczevxlefbretxhyz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4dG9jemV2eGxlZmJyZXR4aHl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MTEzMTAsImV4cCI6MjA5MjE4NzMxMH0.YJIi3uFcDQaPY_o4aDyGylALjo1yZdfcr9APi8Y_Od0';

// SecureStore has a 2048-byte limit per key.
// Split large values (JWT tokens) into chunks to avoid the warning.
const CHUNK_SIZE = 1800;

const ChunkedSecureStore = {
  getItem: async (key: string): Promise<string | null> => {
    const count = await SecureStore.getItemAsync(`${key}_chunks`);
    if (!count) return SecureStore.getItemAsync(key); // backwards compat
    const chunks: string[] = [];
    for (let i = 0; i < parseInt(count, 10); i++) {
      const chunk = await SecureStore.getItemAsync(`${key}_${i}`);
      if (chunk == null) return null;
      chunks.push(chunk);
    }
    return chunks.join('');
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const chunks = Math.ceil(value.length / CHUNK_SIZE);
    await SecureStore.setItemAsync(`${key}_chunks`, String(chunks));
    for (let i = 0; i < chunks; i++) {
      await SecureStore.setItemAsync(`${key}_${i}`, value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
    }
  },
  removeItem: async (key: string): Promise<void> => {
    const count = await SecureStore.getItemAsync(`${key}_chunks`);
    if (count) {
      await SecureStore.deleteItemAsync(`${key}_chunks`);
      for (let i = 0; i < parseInt(count, 10); i++) {
        await SecureStore.deleteItemAsync(`${key}_${i}`);
      }
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ChunkedSecureStore as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

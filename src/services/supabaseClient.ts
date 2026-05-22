import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

let client: ReturnType<typeof createClient>;

if (supabaseUrl && supabasePublishableKey) {
  client = createClient(supabaseUrl, supabasePublishableKey);
} else {
  client = new Proxy({} as ReturnType<typeof createClient>, {
    get() {
      throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
    },
  });
}

export { client as supabase };

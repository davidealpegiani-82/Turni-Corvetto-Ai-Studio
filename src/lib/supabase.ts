import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://zrvnojbhkrxjgdmdjiyt.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpydm5vamJoa3J4amdkbWRqaXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MDMzMTgsImV4cCI6MjEwNzI3OTMxOH0.UDsS8vrlHbqf_NMwYKknPrMLA_Gti3hgrJ5XbWK-IHw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

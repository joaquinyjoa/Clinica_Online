import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sujetlkjhxgmusxgldxj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1amV0bGtqaHhnbXVzeGdsZHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MDU0MzksImV4cCI6MjA3NTM4MTQzOX0.gIv8vjJyP82bCVAnEh7eRNnDbswcO6_1hetseZhJ_34';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

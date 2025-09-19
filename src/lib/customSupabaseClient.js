import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dvdhllhdbbybixwhtgnm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2ZGhsbGhkYmJ5Yml4d2h0Z25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3OTYzNDUsImV4cCI6MjA2ODM3MjM0NX0.ERqUze9EpJz30V1M7vtnyd750KzWBJod7fSguvFA40c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
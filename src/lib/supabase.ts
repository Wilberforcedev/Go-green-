import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export type UserRole = 'participant' | 'organizer' | 'admin';

export interface Activity {
  id: string;
  title: string;
  category: 'Tree planting' | 'Clean-ups' | 'Learning' | 'Clean energy';
  place: string;
  starts_at: string;
  points: number;
  capacity: number;
  spots_remaining: number;
  description: string;
  image_url: string | null;
  impact_measure: string;
  impact_source_url: string | null;
  organizer_id: string;
}

export interface ActivitySignup {
  id: string;
  activity_id: string;
  participant_id: string;
  status: 'registered' | 'attended' | 'cancelled';
  created_at: string;
  participant?: { display_name: string | null } | null;
  activity?: Pick<Activity, 'title' | 'starts_at' | 'place' | 'points'> | null;
}

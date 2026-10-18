import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { UserRole } from '../lib/supabase';

export interface AuthState {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  refreshRole: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

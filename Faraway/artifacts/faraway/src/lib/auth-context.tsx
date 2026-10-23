import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { requireSupabase, supabase } from './supabase';
import { defaults, getState, loadDemoState, replaceAccountState, subscribeStore } from './store';
import { personalData } from './personal-data';
import { personalRepository } from './personal-repository';
import { PersonalSync, type SyncStatus } from './personal-sync';

type AuthContextValue = {
  initialized: boolean;
  signingOut: boolean;
  user: User | null;
  syncStatus: SyncStatus;
  error: string;
  signIn(email: string, password: string): Promise<void>;
  signUp(name: string, email: string, password: string): Promise<boolean>;
  signOut(): Promise<void>;
  demo(): void;
  retry(): Promise<void>;
};
const AuthContext = createContext<AuthContextValue | null>(null);
const message = (error: unknown) => error instanceof Error ? error.message : String(error);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ phase: 'idle' });
  const sync = useMemo(() => new PersonalSync(personalRepository, setSyncStatus), []);

  const restore = async (account: User) => {
    let isNew = false;
    await sync.connect(account.id, (data) => {
      isNew = !data;
      const name = String(account.user_metadata?.full_name || account.email?.split('@')[0] || 'Explorer');
      const initial = structuredClone(defaults);
      initial.profile.name = name; initial.profile.email = account.email || '';
      replaceAccountState({ id: account.id, name, email: account.email || '' }, data ?? personalData(initial));
    });
    if (isNew && sync.ready && getState().session?.id === account.id) sync.changed(personalData(getState()));
  };

  useEffect(() => {
    let active = true;
    let accountId: string | null = null;
    let events = 0;
    const apply = (account: User | null) => {
      if (!active) return;
      setInitialized(true);
      setError('');
      setUser(account);
      if ((account?.id ?? null) === accountId) return; // Token refresh must not erase edits.
      accountId = account?.id ?? null;
      sync.disconnect();
      replaceAccountState(null);
      setSyncStatus({ phase: 'idle' });
      if (account) void restore(account);
    };
    const unwatch = subscribeStore(() => {
      if (getState().session?.id && sync.ready) sync.changed(personalData(getState()));
    });
    if (!supabase) {
      replaceAccountState(null);
      setInitialized(true);
      return () => { active = false; unwatch(); sync.disconnect(); };
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      events++;
      // Keep database requests outside Supabase's auth event lock.
      queueMicrotask(() => apply(session?.user ?? null));
    });
    const eventVersion = events;
    void supabase.auth.getSession().then(({ data, error: authError }) => {
      if (!active || events !== eventVersion) return;
      if (authError) { setError(authError.message); setInitialized(true); }
      else apply(data.session?.user ?? null);
    }).catch((e) => { if (active) { setError(message(e)); setInitialized(true); } });
    const onOnline = () => { void sync.flush().catch(() => {}); };
    const onClose = (e: BeforeUnloadEvent) => {
      if (sync.hasPending) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('beforeunload', onClose);
    return () => {
      active = false; unwatch(); subscription.unsubscribe(); sync.disconnect();
      window.removeEventListener('online', onOnline); window.removeEventListener('beforeunload', onClose);
    };
  }, [sync]);

  const value: AuthContextValue = {
    initialized, signingOut, user, syncStatus, error,
    async signIn(email, password) {
      setError('');
      const { error } = await requireSupabase().auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    async signUp(name, email, password) {
      setError('');
      const { data, error } = await requireSupabase().auth.signUp({ email, password,
        options: { data: { full_name: name }, emailRedirectTo: new URL(import.meta.env.BASE_URL, window.location.origin).href } });
      if (error) throw error;
      return Boolean(data.session);
    },
    async signOut() {
      setError(''); setSigningOut(true);
      try {
        if (user) {
          await sync.flush();
          const { error } = await requireSupabase().auth.signOut({ scope: 'local' });
          if (error) throw error;
        } else {
          sync.disconnect(); replaceAccountState(null);
        }
      } catch (e) { setError(message(e)); }
      finally { setSigningOut(false); }
    },
    demo() {
      sync.disconnect();
      replaceAccountState({ name: 'Demo Explorer', email: 'demo@example.com' }, loadDemoState());
      setSyncStatus({ phase: 'idle' });
    },
    async retry() {
      setError('');
      try {
        if (user && !sync.ready) await restore(user);
        else await sync.flush();
      } catch (e) { setError(message(e)); }
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('AuthProvider is required');
  return auth;
}

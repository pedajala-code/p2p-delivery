import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) fetchProfile(s.user.id);
      else setLoading(false);
    });

    const authChange = supabase.auth.onAuthStateChange((_event, s) => {
      // s can be a session object or null
      const sess = s?.user ? s : null;
      setSession(sess);
      if (sess?.user) fetchProfile(sess.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    const subscription = authChange?.data?.subscription;
    return () => { if (subscription?.unsubscribe) subscription.unsubscribe(); };
  }, []);

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist yet — new user
        setProfile(null);
      } else if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } finally {
      setLoading(false);
    }
  }

  async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error && data?.session) {
      setSession(data.session);
      if (data.session.user) {
        await fetchProfile(data.session.user.id);
      }
    }
    return { data, error };
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data?.session) {
      setSession(data.session);
      if (data.session.user) {
        await fetchProfile(data.session.user.id);
      }
    }
    return { data, error };
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setSession(null);
      setProfile(null);
    }
    return { error };
  }

  async function verifyPhone(phone) {
    const { data, error } = await supabase.auth.signInWithOtp({ phone });
    return { data, error };
  }

  async function verifyOtp(phone, token) {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    return { data, error };
  }

  async function updateProfile(updates) {
    if (!session?.user) return { error: { message: 'Not authenticated' } };
    const { data, error } = await supabase
      .from('users')
      .upsert({ id: session.user.id, ...updates })
      .select()
      .single();

    if (!error) {
      console.log('Setting profile to:', data);
      setProfile({ ...data });
      setUpdateCount(c => c + 1);
    }
    return { data, error };
  }

  async function refreshProfile() {
    if (session?.user) await fetchProfile(session.user.id);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        verifyPhone,
        verifyOtp,
        updateProfile,
        refreshProfile,
        user: session?.user ?? null,
        updateCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

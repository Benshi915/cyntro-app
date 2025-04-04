import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function Home() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return (
      <div style={{ padding: 32 }}>
        <h1>Cyntro Login</h1>
        <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'github' })}>
          Sign in with GitHub
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 32 }}>
      <h1>Welcome to Cyntro Dashboard</h1>
      <p>User: {session.user.email}</p>
      <button onClick={() => supabase.auth.signOut()}>Sign out</button>
    </div>
  );
}

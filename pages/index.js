import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useRouter } from 'next/router';

export default function Home() {
  const [session, setSession] = useState(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) router.push('/profile');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) router.push('/profile');
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div style={{ padding: 32 }}>
      <h1>Welcome to Cyntro</h1>
      <a href="/login">Login</a> | <a href="/register">Register</a>
    </div>
  );
}
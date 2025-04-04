import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useRouter } from 'next/router';

export default function Profile() {
  const [session, setSession] = useState(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login');
      else setSession(session);
    });
  }, []);

  if (!session) return <div>Loading...</div>;

  return (
    <div style={{ padding: 32 }}>
      <h1>Welcome to your profile</h1>
      <p>Email: {session.user.email}</p>
      <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))}>Sign Out</button>
    </div>
  );
}
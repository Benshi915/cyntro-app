import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../utils/supabaseClient';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.push('/dashboard'); // כבר מחובר
      } else {
        router.push('/login'); // לא מחובר
      }
    };

    checkSession();
  }, [router]);

  return (
    <div style={{ padding: 32 }}>
      <h2>טוען את האפליקציה...</h2>
    </div>
  );
}

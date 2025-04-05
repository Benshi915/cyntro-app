import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../utils/supabaseClient';
import Sidebar from '../components/Sidebar';
import KPIBox from '../components/KPIBox';
import ProductCard from '../components/ProductCard';

export default function Dashboard() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
      } else {
        setSession(session);
      }

      setLoading(false);
    };

    checkSession();
  }, [router]);

  if (loading) {
    return <div style={{ padding: 32 }}>טוען...</div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flexGrow: 1, padding: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Dashboard</h1>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <KPIBox title="Revenue" value="$12,350" />
          <KPIBox title="Expenses" value="$3,270" />
          <KPIBox title="Profit" value="$9,080" />
          <KPIBox title="Units Sold" value="541" />
        </div>

        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Products</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <ProductCard name="Product A" revenue="$3,200" profit="$1,780" units="152" orders="140" acos="24%" />
          <ProductCard name="Product B" revenue="$2,150" profit="$990" units="101" orders="94" acos="29%" />
        </div>
      </main>
    </div>
  );
}

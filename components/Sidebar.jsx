import Link from 'next/link';

export default function Sidebar() {
  return (
    <div style={{ width: '200px', padding: '20px', backgroundColor: '#f5f5f5', height: '100vh' }}>
      <h3>Menu</h3>
      <ul>
        <li><Link href="/dashboard">Dashboard</Link></li>
      </ul>
    </div>
  );
}

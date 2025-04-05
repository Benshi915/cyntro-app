import React from 'react';
import Link from 'next/link';

export default function Sidebar() {
  return (
    <div style={{ width: '200px', background: '#f4f4f4', padding: '20px', height: '100vh' }}>
      <h2>Menu</h2>
      <ul>
        <li><Link href="/dashboard">Dashboard</Link></li>
      </ul>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside style={{
      width: '220px',
      backgroundColor: '#f2f2f2',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      borderRight: '1px solid #ddd'
    }}>
      <h2 style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Cyntro</h2>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <a href="/dashboard">Dashboard</a>
        <a href="#">Products</a>
        <a href="#">Advertising</a>
        <a href="#">Reports</a>
        <a href="#">Settings</a>
        <a href="#">Log Out</a>
      </nav>
    </aside>
  )
}
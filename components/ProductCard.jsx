export default function ProductCard({ name, revenue, profit, units, orders, acos }) {
  return (
    <div style={{
      border: '1px solid #ddd',
      padding: '1rem',
      borderRadius: '8px',
      backgroundColor: '#fff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <h3 style={{ marginBottom: '0.5rem' }}>{name}</h3>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div><strong>Revenue:</strong> {revenue}</div>
        <div><strong>Profit:</strong> {profit}</div>
        <div><strong>Units:</strong> {units}</div>
        <div><strong>Orders:</strong> {orders}</div>
        <div><strong>ACOS:</strong> {acos}</div>
      </div>
    </div>
  );
}
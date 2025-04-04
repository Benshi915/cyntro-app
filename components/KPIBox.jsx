export default function KPIBox({ title, value }) {
  return (
    <div style={{
      flex: '1 1 200px',
      backgroundColor: '#fff',
      border: '1px solid #ddd',
      padding: '1rem',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <h4 style={{ marginBottom: '0.5rem', color: '#555' }}>{title}</h4>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{value}</div>
    </div>
  );
}
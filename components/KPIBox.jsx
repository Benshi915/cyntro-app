export default function KPIBox({ title, value }) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', width: '200px' }}>
      <h4>{title}</h4>
      <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{value}</p>
    </div>
  );
}

export default function ProductCard({ product }) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', marginBottom: '10px' }}>
      <h4>{product.name}</h4>
      <p>Sales: ${product.sales}</p>
      <p>Profit: ${product.profit}</p>
      <p>Units: {product.units}</p>
      <p>ACOS: {product.acos}%</p>
      <p>CTR: {product.ctr}%</p>
      <p>CPC: ${product.cpc}</p>
      <p>CVR: {product.cvr}%</p>
    </div>
  );
}

import React from 'react';

export default function ProductCard({ product }) {
  return (
    <div style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px' }}>
      <h3>{product.name}</h3>
      <p>Sales: ${product.sales}</p>
      <p>Profit: ${product.profit}</p>
      <p>Units: {product.units}</p>
    </div>
  );
}

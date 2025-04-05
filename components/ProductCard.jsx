import React from 'react';

const ProductCard = ({ product }) => {
  if (!product || !product.name) {
    return null; // מונע קריסה בבילד
  }

  return (
    <div style={{ border: '1px solid #eee', padding: '16px', marginBottom: '16px' }}>
      <h3>{product.name}</h3>
      <p>Sales: ${product.sales.toLocaleString()}</p>
      <p>Profit: ${product.profit.toLocaleString()}</p>
      <p>Units: {product.units.toLocaleString()}</p>
    </div>
  );
};

export default ProductCard;

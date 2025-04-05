import React from 'react';

export default function KPIBox({ title, value, subtitle }) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '20px', flex: 1 }}>
      <h3>{title}</h3>
      <h1>{value}</h1>
      <p>{subtitle}</p>
    </div>
  );
}

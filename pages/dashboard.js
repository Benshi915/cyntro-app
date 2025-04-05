import React from 'react';
import Sidebar from '../components/Sidebar';
import KPIBox from '../components/KPIBox';
import ProductCard from '../components/ProductCard';

const mockData = {
  kpis: {
    sales: '$350,897',
    units: '14,794',
    profit: '$80,706',
    expenses: '$270,191',
  },
  products: [
    { name: 'Nike Sneakers', sales: 78603, profit: 18503, units: 4623 },
    { name: 'Blue Sneakers', sales: 47162, profit: 6476, units: 2543 }
  ]
};

export default function Dashboard() {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '20px' }}>
        <h1>Dashboard</h1>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <KPIBox title="Sales" value={mockData.kpis.sales} subtitle="↑ 12%" />
          <KPIBox title="Units" value={mockData.kpis.units} subtitle="↓ 4%" />
          <KPIBox title="Profit" value={mockData.kpis.profit} subtitle="↑ 8%" />
          <KPIBox title="Expenses" value={mockData.kpis.expenses} subtitle="↓ 2%" />
        </div>
        <h2>Products</h2>
        {mockData.products.map((product, i) => (
          <ProductCard key={i} product={product} />
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import KPIBox from '../components/KPIBox';
import DashboardChart from '../components/DashboardChart';
import ProductCard from '../components/ProductCard';

const dummyData = {
  today: [...Array(7)].map((_, i) => ({
    date: `Apr ${i + 1}`,
    sales: 12000 + i * 1000,
    profit: 8000 + i * 800,
    units: 2000 + i * 100,
    orders: 1500 + i * 90,
    cvr: 3 + i * 0.2,
    cpc: 0.45 + i * 0.01,
    ctr: 1.2 + i * 0.1,
    acos: 25 - i * 0.5
  })),
  // Add dummy datasets for other periods here if needed
};

const kpis = {
  sales: 310000,
  units: 14000,
  profit: 78000,
  expenses: 232000,
};

const productExample = {
  name: 'Nike Sneakers',
  sales: 78603,
  profit: 18503,
  units: 4623,
  acos: 23.4,
  ctr: 1.23,
  cpc: 0.52,
  cvr: 3.7
};

export default function Dashboard() {
  const [selectedRange, setSelectedRange] = useState('today');
  const [yMetric, setYMetric] = useState('sales');
  const chartData = dummyData[selectedRange];

  const metricLabels = {
    sales: 'Sales ($)',
    profit: 'Profit ($)',
    units: 'Units Sold',
    orders: 'Orders',
    cvr: 'CVR (%)',
    cpc: 'CPC ($)',
    ctr: 'CTR (%)',
    acos: 'ACOS (%)'
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ padding: '20px', flex: 1 }}>
        <h1>Dashboard</h1>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <KPIBox title="Sales" value={kpis.sales.toLocaleString()} />
          <KPIBox title="Units" value={kpis.units.toLocaleString()} />
          <KPIBox title="Profit" value={kpis.profit.toLocaleString()} />
          <KPIBox title="Expenses" value={kpis.expenses.toLocaleString()} />
        </div>

        <div style={{ marginBottom: '10px' }}>
          {['today', 'yesterday', 'last7', 'thisMonth', 'lastMonth', 'custom'].map(label => (
            <button key={label} onClick={() => setSelectedRange('today')} style={{ marginRight: '10px' }}>
              {label.charAt(0).toUpperCase() + label.slice(1).replace(/([A-Z])/g, ' $1')}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Y-Axis: </label>
          <select value={yMetric} onChange={(e) => setYMetric(e.target.value)}>
            {Object.keys(metricLabels).map(metric => (
              <option key={metric} value={metric}>{metricLabels[metric]}</option>
            ))}
          </select>
        </div>

        <h3>Sales Over Time</h3>
        <DashboardChart data={chartData} yKey={yMetric} />

        <h2>Products</h2>
        <ProductCard product={productExample} />
      </div>
    </div>
  );
}

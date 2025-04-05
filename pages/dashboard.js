import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = {
  today: {
    kpis: { sales: 21000, profit: 7800, units: 3800, expenses: 13200 },
    'Sales ($)': [{ date: 'Apr 7', value: 21000 }],
    'Profit ($)': [{ date: 'Apr 7', value: 7800 }],
    'Units': [{ date: 'Apr 7', value: 3800 }],
    'Orders': [{ date: 'Apr 7', value: 3400 }],
    'CVR (%)': [{ date: 'Apr 7', value: 3.1 }],
    'CPC ($)': [{ date: 'Apr 7', value: 0.52 }],
    'CTR (%)': [{ date: 'Apr 7', value: 1.6 }],
    'ACOS (%)': [{ date: 'Apr 7', value: 24 }]
  },
  last7: {
    kpis: { sales: 310000, profit: 78000, units: 14000, expenses: 232000 },
    'Sales ($)': [
      { date: 'Apr 1', value: 12000 },
      { date: 'Apr 2', value: 14000 },
      { date: 'Apr 3', value: 13500 },
      { date: 'Apr 4', value: 19000 },
      { date: 'Apr 5', value: 17000 },
      { date: 'Apr 6', value: 21000 },
      { date: 'Apr 7', value: 23000 }
    ],
    'Profit ($)': [
      { date: 'Apr 1', value: 6000 },
      { date: 'Apr 2', value: 6500 },
      { date: 'Apr 3', value: 6400 },
      { date: 'Apr 4', value: 8000 },
      { date: 'Apr 5', value: 7200 },
      { date: 'Apr 6', value: 8500 },
      { date: 'Apr 7', value: 8700 }
    ],
    'Units': [
      { date: 'Apr 1', value: 3000 },
      { date: 'Apr 2', value: 3200 },
      { date: 'Apr 3', value: 3100 },
      { date: 'Apr 4', value: 4000 },
      { date: 'Apr 5', value: 3900 },
      { date: 'Apr 6', value: 4200 },
      { date: 'Apr 7', value: 4300 }
    ],
    'Orders': [
      { date: 'Apr 1', value: 2800 },
      { date: 'Apr 2', value: 2900 },
      { date: 'Apr 3', value: 3000 },
      { date: 'Apr 4', value: 3700 },
      { date: 'Apr 5', value: 3600 },
      { date: 'Apr 6', value: 3800 },
      { date: 'Apr 7', value: 3900 }
    ],
    'CVR (%)': [
      { date: 'Apr 1', value: 3 },
      { date: 'Apr 2', value: 3.2 },
      { date: 'Apr 3', value: 3.3 },
      { date: 'Apr 4', value: 3.5 },
      { date: 'Apr 5', value: 3.4 },
      { date: 'Apr 6', value: 3.6 },
      { date: 'Apr 7', value: 3.7 }
    ],
    'CPC ($)': [
      { date: 'Apr 1', value: 0.45 },
      { date: 'Apr 2', value: 0.48 },
      { date: 'Apr 3', value: 0.5 },
      { date: 'Apr 4', value: 0.55 },
      { date: 'Apr 5', value: 0.52 },
      { date: 'Apr 6', value: 0.51 },
      { date: 'Apr 7', value: 0.52 }
    ],
    'CTR (%)': [
      { date: 'Apr 1', value: 1.2 },
      { date: 'Apr 2', value: 1.3 },
      { date: 'Apr 3', value: 1.4 },
      { date: 'Apr 4', value: 1.5 },
      { date: 'Apr 5', value: 1.6 },
      { date: 'Apr 6', value: 1.7 },
      { date: 'Apr 7', value: 1.8 }
    ],
    'ACOS (%)': [
      { date: 'Apr 1', value: 20 },
      { date: 'Apr 2', value: 21 },
      { date: 'Apr 3', value: 22 },
      { date: 'Apr 4', value: 24 },
      { date: 'Apr 5', value: 23 },
      { date: 'Apr 6', value: 24 },
      { date: 'Apr 7', value: 25 }
    ]
  }
};

export default function Dashboard() {
  const [selectedRange, setSelectedRange] = useState('last7');
  const [selectedMetric, setSelectedMetric] = useState('CTR (%)');

  const data = chartData[selectedRange]?.[selectedMetric] || [];
  const kpis = chartData[selectedRange]?.kpis || {};

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Dashboard</h1>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ flex: 1, padding: '1rem', border: '1px solid #ccc' }}>
          <h4>Sales</h4>
          <p>{kpis.sales?.toLocaleString() || '-'}</p>
        </div>
        <div style={{ flex: 1, padding: '1rem', border: '1px solid #ccc' }}>
          <h4>Units</h4>
          <p>{kpis.units?.toLocaleString() || '-'}</p>
        </div>
        <div style={{ flex: 1, padding: '1rem', border: '1px solid #ccc' }}>
          <h4>Profit</h4>
          <p>{kpis.profit?.toLocaleString() || '-'}</p>
        </div>
        <div style={{ flex: 1, padding: '1rem', border: '1px solid #ccc' }}>
          <h4>Expenses</h4>
          <p>{kpis.expenses?.toLocaleString() || '-'}</p>
        </div>
      </div>

      {/* Date Range Selector */}
      <div style={{ marginBottom: '1rem' }}>
        {['today', 'yesterday', 'last7', 'thisMonth', 'lastMonth', 'custom'].map(range => (
          <button key={range} onClick={() => setSelectedRange(range)} style={{ marginRight: '0.5rem' }}>
            {range === 'last7' ? 'Last 7 Days' : range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {/* Y-Axis Selector */}
      <div style={{ marginBottom: '1rem' }}>
        <label>Y-Axis: </label>
        <select value={selectedMetric} onChange={e => setSelectedMetric(e.target.value)}>
          {['Sales ($)', 'Profit ($)', 'Units', 'Orders', 'CVR (%)', 'CPC ($)', 'CTR (%)', 'ACOS (%)'].map(metric => (
            <option key={metric} value={metric}>{metric}</option>
          ))}
        </select>
      </div>

      {/* Chart */}
      <h4>Sales Over Time</h4>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#8884d8" dot />
        </LineChart>
      </ResponsiveContainer>

      {/* Product Cards */}
      <h4 style={{ marginTop: '2rem' }}>Products</h4>
      <div style={{ border: '1px solid #ccc', padding: '1rem', marginTop: '1rem' }}>
        <b>Nike Sneakers</b>
        <p>Sales: $78,603</p>
        <p>Profit: $18,503</p>
        <p>Units: 4,623</p>
        <p>ACOS: 23.4%</p>
        <p>CTR: 1.23%</p>
        <p>CPC: $0.52</p>
        <p>CVR: 3.7%</p>
      </div>
    </div>
  );
}

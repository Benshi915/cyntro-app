import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = {
  today: {
    'Sales ($)': [{ date: 'Apr 7', value: 21000 }],
    'Profit ($)': [{ date: 'Apr 7', value: 7800 }],
    'Units': [{ date: 'Apr 7', value: 3800 }],
    'Orders': [{ date: 'Apr 7', value: 3400 }],
    'CVR (%)': [{ date: 'Apr 7', value: 3.1 }],
    'CPC ($)': [{ date: 'Apr 7', value: 0.52 }],
    'CTR (%)': [{ date: 'Apr 7', value: 1.6 }],
    'ACOS (%)': [{ date: 'Apr 7', value: 24 }]
  },
  yesterday: {
    'Sales ($)': [{ date: 'Apr 6', value: 18000 }],
    'Profit ($)': [{ date: 'Apr 6', value: 7000 }],
    'Units': [{ date: 'Apr 6', value: 3600 }],
    'Orders': [{ date: 'Apr 6', value: 3100 }],
    'CVR (%)': [{ date: 'Apr 6', value: 2.9 }],
    'CPC ($)': [{ date: 'Apr 6', value: 0.5 }],
    'CTR (%)': [{ date: 'Apr 6', value: 1.4 }],
    'ACOS (%)': [{ date: 'Apr 6', value: 22 }]
  },
  last7: {
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
  },
  thisMonth: {
    'Sales ($)': Array.from({ length: 10 }, (_, i) => ({ date: `Apr ${i + 1}`, value: 10000 + i * 1200 })),
    'Profit ($)': Array.from({ length: 10 }, (_, i) => ({ date: `Apr ${i + 1}`, value: 4000 + i * 700 })),
    'Units': Array.from({ length: 10 }, (_, i) => ({ date: `Apr ${i + 1}`, value: 2500 + i * 150 })),
    'Orders': Array.from({ length: 10 }, (_, i) => ({ date: `Apr ${i + 1}`, value: 2200 + i * 140 })),
    'CVR (%)': Array.from({ length: 10 }, (_, i) => ({ date: `Apr ${i + 1}`, value: 2.5 + i * 0.1 })),
    'CPC ($)': Array.from({ length: 10 }, (_, i) => ({ date: `Apr ${i + 1}`, value: 0.4 + i * 0.01 })),
    'CTR (%)': Array.from({ length: 10 }, (_, i) => ({ date: `Apr ${i + 1}`, value: 1 + i * 0.1 })),
    'ACOS (%)': Array.from({ length: 10 }, (_, i) => ({ date: `Apr ${i + 1}`, value: 20 + i }))
  },
  lastMonth: {
    'Sales ($)': Array.from({ length: 10 }, (_, i) => ({ date: `Mar ${i + 1}`, value: 9000 + i * 1100 })),
    'Profit ($)': Array.from({ length: 10 }, (_, i) => ({ date: `Mar ${i + 1}`, value: 3800 + i * 600 })),
    'Units': Array.from({ length: 10 }, (_, i) => ({ date: `Mar ${i + 1}`, value: 2300 + i * 140 })),
    'Orders': Array.from({ length: 10 }, (_, i) => ({ date: `Mar ${i + 1}`, value: 2000 + i * 130 })),
    'CVR (%)': Array.from({ length: 10 }, (_, i) => ({ date: `Mar ${i + 1}`, value: 2.3 + i * 0.08 })),
    'CPC ($)': Array.from({ length: 10 }, (_, i) => ({ date: `Mar ${i + 1}`, value: 0.38 + i * 0.01 })),
    'CTR (%)': Array.from({ length: 10 }, (_, i) => ({ date: `Mar ${i + 1}`, value: 0.9 + i * 0.1 })),
    'ACOS (%)': Array.from({ length: 10 }, (_, i) => ({ date: `Mar ${i + 1}`, value: 18 + i }))
  }
};

export default function Dashboard() {
  const [selectedRange, setSelectedRange] = useState('last7');
  const [selectedMetric, setSelectedMetric] = useState('Sales ($)');
  const data = chartData[selectedRange]?.[selectedMetric] || [];

  const dateOptions = {
    today: 'Today',
    yesterday: 'Yesterday',
    last7: 'Last 7 Days',
    thisMonth: 'This Month',
    lastMonth: 'Last Month',
    custom: 'Custom'
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Dashboard</h1>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label>Date Range: </label>
          <select value={selectedRange} onChange={e => setSelectedRange(e.target.value)}>
            {Object.keys(dateOptions).map(key => (
              <option key={key} value={key}>{dateOptions[key]}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Y-Axis: </label>
          <select value={selectedMetric} onChange={e => setSelectedMetric(e.target.value)}>
            {['Sales ($)', 'Profit ($)', 'Units', 'Orders', 'CVR (%)', 'CPC ($)', 'CTR (%)', 'ACOS (%)'].map(metric => (
              <option key={metric} value={metric}>{metric}</option>
            ))}
          </select>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#8884d8" dot />
        </LineChart>
      </ResponsiveContainer>

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

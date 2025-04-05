import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { date: 'Apr 1', sales: 12000 },
  { date: 'Apr 2', sales: 15000 },
  { date: 'Apr 3', sales: 14000 },
  { date: 'Apr 4', sales: 19000 },
  { date: 'Apr 5', sales: 17000 },
  { date: 'Apr 6', sales: 21000 },
  { date: 'Apr 7', sales: 23000 },
];

export default function DashboardChart() {
  return (
    <div style={{ width: '100%', height: 300, marginTop: 32 }}>
      <h3>Sales Over Time</h3>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid stroke="#ccc" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

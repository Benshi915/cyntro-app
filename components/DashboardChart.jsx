import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function DashboardChart({ data, yKey }) {
  return (
    <LineChart width={800} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey={yKey} stroke="#8884d8" />
    </LineChart>
  );
}

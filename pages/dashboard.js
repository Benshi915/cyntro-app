import KPIBox from '../components/KPIBox';
import ProductCard from '../components/ProductCard';
import Sidebar from '../components/Sidebar';
import DashboardChart from '../components/DashboardChart';

export default function Dashboard() {
  const kpis = [
    { title: 'Sales', value: '$350,897', change: '↑ 12%', positive: true },
    { title: 'Units', value: '14,794', change: '↓ 4%', positive: false },
    { title: 'Profit', value: '$80,706', change: '↑ 8%', positive: true },
    { title: 'Expenses', value: '$270,191', change: '↓ 2%', positive: false },
  ];

  const products = [
    { name: 'Nike Sneakers', sales: '$78603', profit: '$18503', units: '4623' },
    { name: 'Blue Sneakers', sales: '$47162', profit: '$6476', units: '2543' },
  ];

  const ranges = ['Today', 'Yesterday', 'Last 7 Days', 'This Month', 'Last Month', 'Custom Range'];

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px' }}>
        <h1>Dashboard</h1>

        <div style={{ display: 'flex', gap: 16 }}>
          {kpis.map((kpi) => (
            <KPIBox key={kpi.title} {...kpi} />
          ))}
        </div>

        <div style={{ marginTop: 24 }}>
          {ranges.map(range => (
            <button key={range} style={{ marginRight: 8 }}>{range}</button>
          ))}
        </div>

        <DashboardChart />

        <h2 style={{ marginTop: 48 }}>Products</h2>
        {products.map((product) => (
          <ProductCard key={product.name} {...product} />
        ))}
      </main>
    </div>
  );
}

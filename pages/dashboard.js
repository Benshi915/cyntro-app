
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import KPIBox from '../components/KPIBox';
import DashboardChart from '../components/DashboardChart';

const DashboardPage = () => {
  const dataByRange = {
    today: {
      kpis: { sales: 12000, units: 490, profit: 2000, expenses: 10000 },
      chart: [
        { date: 'Apr 7', sales: 12000 }
      ]
    },
    yesterday: {
      kpis: { sales: 14000, units: 510, profit: 2200, expenses: 11800 },
      chart: [
        { date: 'Apr 6', sales: 14000 }
      ]
    },
    last7days: {
      kpis: { sales: 350897, units: 14794, profit: 80706, expenses: 270191 },
      chart: [
        { date: 'Apr 1', sales: 12000 },
        { date: 'Apr 2', sales: 14500 },
        { date: 'Apr 3', sales: 13400 },
        { date: 'Apr 4', sales: 18900 },
        { date: 'Apr 5', sales: 16200 },
        { date: 'Apr 6', sales: 20300 },
        { date: 'Apr 7', sales: 21900 }
      ]
    },
    thisMonth: {
      kpis: { sales: 400000, units: 15000, profit: 90000, expenses: 310000 },
      chart: [
        { date: 'Apr 1', sales: 10000 },
        { date: 'Apr 5', sales: 13000 },
        { date: 'Apr 10', sales: 15000 },
        { date: 'Apr 15', sales: 16000 },
        { date: 'Apr 20', sales: 18000 },
        { date: 'Apr 25', sales: 21000 },
        { date: 'Apr 30', sales: 23000 }
      ]
    },
    lastMonth: {
      kpis: { sales: 310000, units: 14000, profit: 78000, expenses: 232000 },
      chart: [
        { date: 'Mar 1', sales: 8000 },
        { date: 'Mar 7', sales: 11000 },
        { date: 'Mar 14', sales: 12500 },
        { date: 'Mar 21', sales: 14300 },
        { date: 'Mar 28', sales: 15900 }
      ]
    },
    custom: {
      kpis: { sales: 0, units: 0, profit: 0, expenses: 0 },
      chart: []
    }
  };

  const [selectedRange, setSelectedRange] = useState('last7days');
  const currentData = dataByRange[selectedRange];

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ padding: '32px', flex: 1 }}>
        <h1>Dashboard</h1>

        <div style={{ display: 'flex', gap: '16px' }}>
          <KPIBox title="Sales" value={currentData.kpis.sales} />
          <KPIBox title="Units" value={currentData.kpis.units} />
          <KPIBox title="Profit" value={currentData.kpis.profit} />
          <KPIBox title="Expenses" value={currentData.kpis.expenses} />
        </div>

        <div style={{ marginTop: '20px' }}>
          {['today', 'yesterday', 'last7days', 'thisMonth', 'lastMonth', 'custom'].map(range => (
            <button
              key={range}
              style={{
                marginRight: '8px',
                padding: '6px 10px',
                backgroundColor: selectedRange === range ? '#eee' : 'white',
                border: '1px solid #ccc',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedRange(range)}
            >
              {{
                today: 'Today',
                yesterday: 'Yesterday',
                last7days: 'Last 7 Days',
                thisMonth: 'This Month',
                lastMonth: 'Last Month',
                custom: 'Custom Range'
              }[range]}
            </button>
          ))}
        </div>

        <h3 style={{ marginTop: '30px' }}>Sales Over Time</h3>
        <DashboardChart data={currentData.chart} />

        <h2 style={{ marginTop: '30px' }}>Products</h2>
      </div>
    </div>
  );
};

export default DashboardPage;

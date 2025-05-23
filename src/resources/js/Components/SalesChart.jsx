// resources/js/Components/SalesChart.jsx
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function SalesChart({ datos }) {
  const chartData = {
    labels: datos.map(item => item.fecha),
    datasets: [
      {
        label: 'Ventas Totales (Bs)',
        data: datos.map(item => item.total_venta),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'Ganancias (Bs)',
        data: datos.map(item => item.ganancia),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Resumen Diario de Ventas y Ganancias' },
    },
  };

  return (
    <div className="card p-4">
      <h4 className="mb-3">Gráfico de Ventas</h4>
      <Bar data={chartData} options={options} />
    </div>
  );
}

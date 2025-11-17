'use client'; 
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Define os dados que o gráfico espera
type Props = {
  data: {
    name: string;
    value: number;
  }[];
}

// Define as cores (como no seu Figma)
const COLORS = {
  'Ativos': '#22c55e', // Verde
  'Inadimplentes': '#ef4444', // Vermelho
  'Inativos': '#f97316', // Laranja
};

export default function StatusAssociadosChart({ data }: Props) {

  const chartData = data.filter(item => item.value > 0);

  return (
    // ResponsiveContainer faz o gráfico preencher o 'div' pai
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={40} 
          outerRadius={90}
          fill="#8884d8"
          paddingAngle={1}
          dataKey="value"
          nameKey="name"
        >
          {chartData.map((entry) => (
            <Cell 
              key={`cell-${entry.name}`} 
              fill={COLORS[entry.name as keyof typeof COLORS] || '#8884d8'} 
            />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => [value, 'Associados']} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
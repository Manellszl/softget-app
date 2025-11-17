'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type Props = {
  data: {
    name: string;
    value: number;
  }[];
}

const COLORS = ['#ef4444', '#f97316', '#eab308'];

export default function DespesasPieChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={90}
          fill="#8884d8"
          paddingAngle={1}
          dataKey="value"
          nameKey="name"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => [
          new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
          'Valor'
        ]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
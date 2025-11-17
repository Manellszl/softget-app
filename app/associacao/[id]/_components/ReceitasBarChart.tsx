'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type Props = {
  data: {
    name: string;
    Valor: number;
  }[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

export default function ReceitasBarChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical" margin={{ left: 30 }}>
        <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(val) => formatCurrency(val)} fontSize={12} />
        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={12} />
        <Tooltip formatter={(value: number) => [formatCurrency(value), 'Valor']} />
        <Bar dataKey="Valor" fill="#3b82f6" barSize={30} />
      </BarChart>
    </ResponsiveContainer>
  );
}
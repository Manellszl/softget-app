'use client'; 

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// Define os dados que o gráfico espera
type Props = {
  data: {
    mes: string;
    Receitas: number;
    Despesas: number;
  }[];
}

// Helper para formatar R$ no tooltip
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

export default function FluxoCaixaChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 0,
          left: -20, 
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis dataKey="mes" fontSize={12} />
        <YAxis 
          fontSize={12}
          tickFormatter={(value) => `R$${value / 1000}k`} 
        />
        <Tooltip formatter={(value: number) => formatCurrency(value)} />
        <Legend />
        <Bar dataKey="Receitas" fill="#22c55e" /> {/* Barra Verde */}
        <Bar dataKey="Despesas" fill="#ef4444" /> {/* Barra Vermelha */}
      </BarChart>
    </ResponsiveContainer>
  );
}
'use client'; 
import { useRouter, usePathname } from 'next/navigation';

function formatPeriodo(ano: number, mes: number) {
  return new Date(ano, mes - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
}

type Periodo = {
  ano: number;
  mes: number;
};

type Props = {
  periodoSelecionado: string;
  periodosDisponiveis: Periodo[];
  periodoAtual: string;
  anoAtual: number;
  mesAtual: number;
};

export default function FiltroPeriodo({
  periodoSelecionado,
  periodosDisponiveis,
  periodoAtual,
  anoAtual,
  mesAtual,
}: Props) {
  
  const router = useRouter();
  const pathname = usePathname(); 

  function handlePeriodoChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const novoPeriodo = e.target.value;
    router.push(`${pathname}?periodo=${novoPeriodo}`);
  }

  return (
    <select 
      name="periodo" 
      value={periodoSelecionado}
      onChange={handlePeriodoChange}
      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
    >
      {periodosDisponiveis.map(({ ano, mes }) => { 
        const valor = `${ano}-${String(mes).padStart(2, '0')}`;
        const nome = formatPeriodo(ano, mes);
        return <option key={valor} value={valor}>{nome}</option>;
      })}
      {(periodosDisponiveis.length === 0) && ( 
        <option value={periodoAtual}>{formatPeriodo(anoAtual, mesAtual)}</option>
      )}
    </select>
  );
}
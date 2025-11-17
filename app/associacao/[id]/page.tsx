import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { 
  Users, 
  Banknote, 
  TrendingUp, 
  TrendingDown, 
  Landmark,
  DollarSign,
  AlertTriangle,
  Truck
} from 'lucide-react';

// Importa os novos componentes de gráfico
import StatusAssociadosChart from './_components/StatusAssociadosChart';
import FluxoCaixaChart from './_components/FluxoCaixaChart';

export const revalidate = 0;

// Helper para formatar R$
function formatCurrency(value: number | null) {
  if (value === null || isNaN(value)) {
    value = 0;
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

type Props = {
  params: Promise<{ id: string }>; 
};

export default async function DashboardAssociacaoPage({ params }: Props) {
  // 1. Obter o ID da Associação
  const { id: associacaoId } = await params;

  // 2. Criar o Cliente Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) { 
          const cookieStore = await cookies();
          return cookieStore.get(name)?.value; 
        },
        async set() {}, 
        async remove() {}, 
      },
    }
  );

  // 3. Buscar os Dados para os Cards e Gráficos

  // --- Dados de Associados (Para Cards e Gráfico de Pizza) ---
  const { data: membros, error: membrosError } = await supabase
    .from('Membros')
    .select('situacao, valor_mensalidade_base')
    .eq('associacao_id', associacaoId);

  // --- Dados Financeiros (Total) ---
  const { data: lancamentosTotais, error: lancamentosError } = await supabase
    .from('Lancamentos_Financeiros')
    .select('valor, data_lancamento')
    .eq('associacao_id', associacaoId);
  
  // --- Dados de Patrimônio (Total) ---
  const { data: patrimonio, error: patrimonioError } = await supabase
    .from('Patrimonio')
    .select('valor_aquisicao')
    .eq('associacao_id', associacaoId);

  // 4. Calcular os Resumos para os Cards
  
  // Resumos de Associados
  const totalAssociados = membros?.length ?? 0;
  const ativos = membros?.filter(m => m.situacao === 'Ativo').length ?? 0;
  const inadimplentes = membros?.filter(m => m.situacao === 'Inadimplente').length ?? 0;
  const inativos = membros?.filter(m => m.situacao === 'Inativo').length ?? 0;
  const mensalidadeEsperada = membros
    ?.filter(m => m.situacao === 'Ativo')
    .reduce((acc, m) => acc + (m.valor_mensalidade_base ?? 0), 0) ?? 0;
  const inadimplenciaPercent = totalAssociados > 0 ? (inadimplentes / totalAssociados) * 100 : 0;

  // Resumos Financeiros
  const receitasTotal = lancamentosTotais
    ?.filter(l => l.valor > 0)
    .reduce((acc, l) => acc + l.valor, 0) ?? 0;
  const despesasTotal = lancamentosTotais
    ?.filter(l => l.valor < 0)
    .reduce((acc, l) => acc + l.valor, 0) ?? 0;
  const saldoTotal = receitasTotal + despesasTotal;

  // Resumo do Patrimônio
  const patrimonioTotal = patrimonio
    ?.reduce((acc, p) => acc + (p.valor_aquisicao ?? 0), 0) ?? 0;

  
  // 5. Processar Dados para os Gráficos

  // Dados do Gráfico de Pizza
  const pieChartData = [
    { name: 'Ativos', value: ativos },
    { name: 'Inadimplentes', value: inadimplentes },
    { name: 'Inativos', value: inativos },
  ];

  // Dados do Gráfico de Barras (Últimos 6 meses)
  const mesesAbreviados = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const barChartData = [];
  const hoje = new Date();

  for (let i = 5; i >= 0; i--) {
    const dataAlvo = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const mes = dataAlvo.getMonth(); // 0-11
    const ano = dataAlvo.getFullYear();

    const lancamentosDoMes = lancamentosTotais?.filter(l => {
      const dataLancamento = new Date(l.data_lancamento);
      return dataLancamento.getMonth() === mes && dataLancamento.getFullYear() === ano;
    }) ?? [];

    const receitas = lancamentosDoMes
      .filter(l => l.valor > 0)
      .reduce((acc, l) => acc + l.valor, 0);
    
    // As despesas são negativas, usamos Math.abs para o gráfico
    const despesas = Math.abs(lancamentosDoMes
      .filter(l => l.valor < 0)
      .reduce((acc, l) => acc + l.valor, 0)); 

    barChartData.push({
      mes: mesesAbreviados[mes],
      Receitas: receitas,
      Despesas: despesas,
    });
  }


  // 6. Renderizar a Página (Agora com os gráficos)
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Dashboard
      </h1>
      <p className="text-lg text-gray-600 mb-8">Visão geral da associação</p>
      
      {/* Linha 1 de Cards (Top 4) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <CardResumo 
          titulo="Total de Associados" 
          valor={totalAssociados.toString()} 
          subtitulo={`${ativos} ativos, ${inadimplentes} inadimplentes`} 
          Icone={Users} 
          corIcone="text-blue-600 bg-blue-100" />
        <CardResumo 
          titulo="Receitas (Total)" 
          valor={formatCurrency(receitasTotal)} 
          subtitulo="Soma de todas as receitas" 
          Icone={TrendingUp} 
          corIcone="text-green-600 bg-green-100" />
        <CardResumo 
          titulo="Despesas (Total)" 
          valor={formatCurrency(despesasTotal)} 
          subtitulo="Soma de todas as despesas" 
          Icone={TrendingDown} 
          corIcone="text-red-600 bg-red-100" />
        <CardResumo 
          titulo="Saldo" 
          valor={formatCurrency(saldoTotal)} 
          subtitulo="Receitas - Despesas" 
          Icone={Landmark} 
          corIcone="text-indigo-600 bg-indigo-100" />
      </div>

      {/* Linha 2 de Gráficos (Agora com componentes reais) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Fluxo Financeiro Mensal</h2>
          <FluxoCaixaChart data={barChartData} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Status dos Associados</h2>
          <StatusAssociadosChart data={pieChartData} />
        </div>
      </div>

      {/* Linha 3 de Cards (Bottom 3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CardResumo 
          titulo="Patrimônio Total" 
          valor={formatCurrency(patrimonioTotal)} 
          subtitulo="Soma dos bens cadastrados" 
          Icone={Truck} 
          corIcone="text-orange-600 bg-orange-100" />
        <CardResumo 
          titulo="Inadimplência" 
          valor={`${inadimplentes} (${inadimplenciaPercent.toFixed(0)}%)`} 
          subtitulo="Associados com pagamentos atrasados" 
          Icone={AlertTriangle} 
          corIcone="text-yellow-600 bg-yellow-100" />
        <CardResumo 
          titulo="Mensalidade Esperada" 
          valor={formatCurrency(mensalidadeEsperada)} 
          subtitulo={`${ativos} associados ativos`} 
          Icone={DollarSign} 
          corIcone="text-teal-600 bg-teal-100" />
      </div>
    </div>
  );
}

// --- Componente de Card Reutilizável ---
type CardProps = {
  titulo: string;
  valor: string;
  subtitulo: string;
  Icone: React.ElementType;
  corIcone: string;
}

function CardResumo({ titulo, valor, subtitulo, Icone, corIcone }: CardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-full ${corIcone}`}>
          <Icone className="w-6 h-6" />
        </div>
      </div>
      <p className="text-sm font-medium text-gray-500">{titulo}</p>
      <p className="text-3xl font-light text-gray-900 mt-1">{valor}</p> {/* Mudado para font-light */}
      <p className="text-xs text-gray-400 mt-2">{subtitulo}</p>
    </div>
  );
}
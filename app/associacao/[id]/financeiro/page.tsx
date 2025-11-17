import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Plus, Download, TrendingUp, TrendingDown, Landmark, CheckSquare, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import ReceitasBarChart from '../_components/ReceitasBarChart';
import DespesasPieChart from '../_components/DespesasPieChart';

export const revalidate = 0;

// --- Helpers ---
function formatCurrency(value: number | null) {
  if (value === null || isNaN(value)) value = 0;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
function formatDate(dateString: string | null) {
  if (!dateString) return 'N/D';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}
function formatPeriodo(ano: number, mes: number) {
  return new Date(ano, mes - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
}

// Definimos o tipo de retorno da nossa função SQL
type Periodo = {
  ano: number;
  mes: number;
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function FinanceiroPage({ params, searchParams }: Props) {
  // Obter o ID da Associação
  const { id: associacaoId } = await params;

  // Criar o Cliente Supabase
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

  // Buscar os Períodos Disponíveis
  const { data: periodosDisponiveis, error: periodosError } = await supabase
    .rpc('get_distinct_months_years', { assoc_id: associacaoId })
    .returns<Periodo[]>(); 

  if (periodosError) console.error('Erro ao buscar períodos:', periodosError);

  // Obter e Definir o Mês/Ano do Filtro
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth() + 1; 
  const periodoAtual = `${anoAtual}-${String(mesAtual).padStart(2, '0')}`;
  
  const searchParamsData = await searchParams;

  const periodosValidos = Array.isArray(periodosDisponiveis) ? periodosDisponiveis : [];

  const periodoSelecionado = (searchParamsData.periodo as string) 
    || (periodosValidos.length > 0 ? `${periodosValidos[0].ano}-${String(periodosValidos[0].mes).padStart(2, '0')}` : periodoAtual);
  
  const [anoSelecionado, mesSelecionado] = periodoSelecionado.split('-').map(Number);

  const primeiroDia = new Date(anoSelecionado, mesSelecionado - 1, 1).toISOString();
  const ultimoDia = new Date(anoSelecionado, mesSelecionado, 0).toISOString();


  // 6. Buscar os Dados do Mês Selecionado
  
  const { count: membrosAtivos, error: membrosError } = await supabase
    .from('Membros')
    .select('*', { count: 'exact', head: true })
    .eq('associacao_id', associacaoId)
    .eq('situacao', 'Ativo');

  const { data: lancamentos, error: lancamentosError } = await supabase
    .from('Lancamentos_Financeiros')
    .select(`
      valor, 
      categoria, 
      tipo, 
      data_lancamento, 
      Membros ( 
        Pessoas ( nome_completo ) 
      )
    `)
    .eq('associacao_id', associacaoId)
    .gte('data_lancamento', primeiroDia)
    .lte('data_lancamento', ultimoDia);

  if (lancamentosError) console.error('Erro ao buscar lançamentos:', lancamentosError.message);

  //  Calcular Resumos
  const listaLancamentos = lancamentos ?? [];
  
  const receitasMes = listaLancamentos.filter(l => l.valor > 0).reduce((acc, l) => acc + l.valor, 0);
  const despesasMes = listaLancamentos.filter(l => l.valor < 0).reduce((acc, l) => acc + l.valor, 0);
  const saldoMes = receitasMes + despesasMes;

  const mensalidadesPagas = listaLancamentos.filter(l => l.categoria === 'Mensalidades').length;
  const totalAtivos = membrosAtivos ?? 0;

  // Gráfico de Barras (Receitas por Categoria)
  const receitasData = listaLancamentos
    .filter(l => l.tipo === 'Receita')
    .reduce((acc, l) => {
      const cat = l.categoria || 'Outros';
      acc[cat] = (acc[cat] || 0) + l.valor;
      return acc;
    }, {} as { [key: string]: number });
  const receitasBarData = Object.keys(receitasData).map(name => ({ name, Valor: receitasData[name] }));

  // Gráfico de Pizza (Despesas por Categoria)
  const despesasData = listaLancamentos
    .filter(l => l.tipo === 'Despesa')
    .reduce((acc, l) => {
      const cat = l.categoria || 'Outros';
      acc[cat] = (acc[cat] || 0) + Math.abs(l.valor);
      return acc;
    }, {} as { [key: string]: number });
  const despesasPieData = Object.keys(despesasData).map(name => ({ name, value: despesasData[name] }));
  
  // Tabela de Mensalidades
  const tabelaMensalidades = listaLancamentos
    .filter(l => l.categoria === 'Mensalidades')
    .map(l => {
      // @ts-ignore
      const nome = l.Membros?.Pessoas?.nome_completo ?? 'Pagamento Avulso';
      return {
        nome: nome,
        data: l.data_lancamento,
        valor: l.valor,
        forma: 'PIX',
      }
    });
    
  // Cards do rodapé
  const totalMensalidades = receitasData['Mensalidades'] ?? 0;
  const totalVerbas = receitasData['Verbas Governamentais'] ?? 0;
  const totalDoacoes = receitasData['Doações'] ?? 0;


  //  Renderizar a Página
  return (
    <div>
      {/* --- Cabeçalho e Filtro --- */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gestão Financeira</h1>
          <p className="text-lg text-gray-600">Controle completo das finanças da associação</p>
        </div>
        <div className="flex items-center space-x-4">
          
          <form method="GET" action="" className="flex items-center space-x-2">
            <select 
              name="periodo" 
              defaultValue={periodoSelecionado}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {periodosValidos.map(({ ano, mes }) => { 
                const valor = `${ano}-${String(mes).padStart(2, '0')}`;
                const nome = formatPeriodo(ano, mes);
                return <option key={valor} value={valor}>{nome}</option>;
              })}
              {(periodosValidos.length === 0) && ( 
                <option value={periodoAtual}>{formatPeriodo(anoAtual, mesAtual)}</option>
              )}
            </select>
            <button type="submit" className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
              Filtrar
            </button>
          </form>

          <button className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700">
            <Plus className="w-5 h-5" />
            <span>Nova Transação</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <ResumoCard titulo="Saldo do Mês" valor={formatCurrency(saldoMes)} Icone={Landmark} cor="text-indigo" />
        <ResumoCard titulo="Receitas do Mês" valor={formatCurrency(receitasMes)} Icone={TrendingUp} cor="text-green" />
        <ResumoCard titulo="Despesas do Mês" valor={formatCurrency(despesasMes)} Icone={TrendingDown} cor="text-red" />
        <ResumoCard titulo="Mensalidades Pagas" valor={`${mensalidadesPagas}/${totalAtivos}`} Icone={CheckSquare} cor="text-blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Distribuição de Receitas</h2>
          <ReceitasBarChart data={receitasBarData} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Despesas por Categoria</h2>
          <DespesasPieChart data={despesasPieData} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-20Um mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Controle de Mensalidades (Pagamentos do mês)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Associado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mês Referência</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Pagamento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Forma de Pagamento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tabelaMensalidades.map((pgto) => (
                <tr key={pgto.nome + pgto.data}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{pgto.nome}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{mesSelecionado}/{anoSelecionado}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{formatCurrency(pgto.valor)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{formatDate(pgto.data)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{pgto.forma}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Pago</span>
                  </td>
                </tr>
              ))}
              {tabelaMensalidades.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Nenhum pagamento de mensalidade registrado para este mês.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResumoCardSimples titulo="Mensalidades" valor={formatCurrency(totalMensalidades)} subtitulo="Contribuições dos associados" />
        <ResumoCardSimples titulo="Verbas Governamentais" valor={formatCurrency(totalVerbas)} subtitulo="Convênios e subvenções" />
        <ResumoCardSimples titulo="Doações" valor={formatCurrency(totalDoacoes)} subtitulo="Contribuições externas" />
      </div>

    </div>
  );
}

// --- Componentes de Card Reutilizáveis ---

function ResumoCard({ titulo, valor, Icone, cor, subtitulo = "" }: { titulo: string, valor: string | number, Icone: React.ElementType, cor: string, subtitulo?: string }) {
  const coresIcone: { [key: string]: string } = {
    'text-indigo': 'text-indigo-600 bg-indigo-100',
    'text-green': 'text-green-600 bg-green-100',
    'text-red': 'text-red-600 bg-red-100',
    'text-blue': 'text-blue-600 bg-blue-100',
  }
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm font-medium text-gray-500">{titulo}</p>
        <div className={`p-2 rounded-full ${coresIcone[cor]}`}>
          <Icone className="w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-light text-gray-900">{valor}</p>
      <p className="text-xs text-gray-400 mt-2">{subtitulo}</p>
    </div>
  );
}

function ResumoCardSimples({ titulo, valor, subtitulo }: { titulo: string, valor: string | number, subtitulo: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <p className="text-sm font-medium text-gray-500">{titulo}</p>
      <p className="text-3xl font-light text-gray-900 mt-1">{valor}</p>
      <p className="text-xs text-gray-400 mt-2">{subtitulo}</p>
    </div>
  );
}
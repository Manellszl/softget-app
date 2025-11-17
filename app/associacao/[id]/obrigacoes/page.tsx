import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Plus, CheckCircle, Clock, AlertCircle, FileText, Landmark, Info } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

// --- Helpers ---
function formatDate(dateString: string | null) {
  if (!dateString) return 'N/D';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

// Componente para a Tag de Status
function StatusTag({ status }: { status: string | null }) {
  let colorClass = '';
  switch (status) {
    case 'Entregue':
      colorClass = 'bg-green-100 text-green-800';
      break;
    case 'Pendente':
      colorClass = 'bg-yellow-100 text-yellow-800';
      break;
    case 'Retificada':
      colorClass = 'bg-blue-100 text-blue-800';
      break;
    case 'Atrasada': // Bônus
      colorClass = 'bg-red-100 text-red-800';
      break;
    default:
      colorClass = 'bg-gray-100 text-gray-800';
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {status ?? 'N/D'}
    </span>
  );
}

// O 'params' vem do layout pai e É UMA PROMISE
type Props = {
  params: Promise<{ id: string }>; 
};

// Tipagem para os dados da tabela
type Obrigacao = {
  id: string;
  tipo: string;
  categoria: string;
  data_referencia: string | null;
  data_entrega: string | null;
  status: string;
};


export default async function ObrigacoesPage({ params }: Props) {
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

  // 3. Buscar os Dados
  const { data: obrigacoes, error } = await supabase
    .from('Obrigacoes')
    .select('*')
    .eq('associacao_id', associacaoId)
    .order('data_referencia', { ascending: false }); // Mais recentes primeiro

  if (error) {
    console.error('Erro ao buscar obrigações:', error.message);
  }

  // 4. Calcular Resumos
  const listaObrigacoes = obrigacoes ?? [];
  
  const total = listaObrigacoes.length;
  const entregues = listaObrigacoes.filter(o => o.status === 'Entregue').length;
  const pendentes = listaObrigacoes.filter(o => o.status === 'Pendente').length;
  const retificadas = listaObrigacoes.filter(o => o.status === 'Retificada').length;
  
  // Listas para os cards do rodapé
  const fiscais = listaObrigacoes.filter(o => o.categoria === 'Fiscal');
  const prestacoes = listaObrigacoes.filter(o => o.categoria === 'Prestação de Contas');

  // 5. Renderizar a Página
  return (
    <div>
      {/* --- Cabeçalho e Botão --- */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Obrigações e Compliance</h1>
          <p className="text-lg text-gray-600">Controle de obrigações legais e prestação de contas</p>
        </div>
        <button className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 w-full md:w-auto">
          <Plus className="w-5 h-5" />
          <span>Nova Obrigação</span>
        </button>
      </div>

      {/* --- Cards de Resumo (Topo) --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <ResumoCard titulo="Total de Obrigações" valor={total} subtitulo="cadastrados no sistema" Icone={FileText} cor="text-blue" />
        <ResumoCard titulo="Entregues" valor={entregues} subtitulo="em conformidade" Icone={CheckCircle} cor="text-green" />
        <ResumoCard titulo="Pendentes" valor={pendentes} subtitulo="aguardando entrega" Icone={Clock} cor="text-yellow" />
        <ResumoCard titulo="Retificadas" valor={retificadas} subtitulo="corrigidas após entrega" Icone={AlertCircle} cor="text-indigo" />
      </div>

      {/* --- Tabela Histórico --- */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Histórico de Obrigações</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Obrigação</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Referência</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Entrega</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {listaObrigacoes.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.tipo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{formatDate(item.data_referencia)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{formatDate(item.data_entrega)}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><StatusTag status={item.status} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2"> {/* space-x-2 para um pouco menos de espaçamento */}
                    <Link href="#" className="inline-flex items-center px-3 py-1 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Ver Detalhes</Link>
                    {item.status === 'Pendente' && (
                      <Link href="#" className="inline-flex items-center px-3 py-1 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Marcar como Entregue</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* --- Cards de Resumo (Rodapé) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Obrigações Fiscais */}
        <ListaObrigacoesCard 
          titulo="Obrigações Fiscais" 
          subtitulo="Declarações e informes"
          icone={Landmark}
          obrigacoes={fiscais}
        />
        {/* Card Prestações de Contas */}
        <ListaObrigacoesCard 
          titulo="Prestações de Contas" 
          subtitulo="Relatórios para órgãos públicos"
          icone={FileText}
          obrigacoes={prestacoes}
        />
        {/* Card Dicas */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2 mb-4">
            <Info className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-800">Dicas de Compliance</h3>
          </div>
          <ul className="space-y-2 text-sm text-blue-700">
            <li className="flex items-start">
              <span className="mr-2 mt-1">•</span>
              <span>Mantenha sempre uma pasta organizada com todos os documentos entregues.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 mt-1">•</span>
              <span>Configure alertas com 15 dias de antecedência para obrigações importantes.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 mt-1">•</span>
              <span>Guarde os recibos de entrega e protocolos de todas as obrigações.</span>
            </li>
          </ul>
        </div>
      </div>

    </div>
  );
}

// --- Componentes de Card Reutilizáveis ---

function ResumoCard({ titulo, valor, subtitulo, Icone, cor }: { titulo: string, valor: string | number, subtitulo: string, Icone: React.ElementType, cor: string }) {
  const coresIcone: { [key: string]: string } = {
    'text-blue': 'text-blue-600 bg-blue-100',
    'text-green': 'text-green-600 bg-green-100',
    'text-yellow': 'text-yellow-600 bg-yellow-100',
    'text-indigo': 'text-indigo-600 bg-indigo-100',
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

// Card para a lista de obrigações no rodapé
function ListaObrigacoesCard({ titulo, subtitulo, icone: Icone, obrigacoes }: { titulo: string, subtitulo: string, icone: React.ElementType, obrigacoes: Obrigacao[] }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center space-x-2 mb-4">
        <Icone className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-800">{titulo}</h3>
      </div>
      <p className="text-sm text-gray-500 mb-4">{subtitulo}</p>
      <ul className="space-y-3">
        {obrigacoes.map(item => (
          <li key={item.id} className="flex justify-between items-center text-sm">
            <div>
              <p className="font-medium text-gray-800">{item.tipo}</p>
              <p className="text-xs text-gray-500">Referência: {formatDate(item.data_referencia)}</p>
            </div>
            <StatusTag status={item.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}
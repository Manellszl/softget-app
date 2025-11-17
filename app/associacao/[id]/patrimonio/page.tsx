import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Plus, Eye, Calendar, Settings, Truck, Package, Building } from 'lucide-react';
import Link from 'next/link';

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
function formatDateTime(dateString: string | null) {
  if (!dateString) return 'N/D';
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Componente para a Tag de Status
function StatusTag({ status }: { status: string | null }) {
  let colorClass = '';
  switch (status) {
    case 'Disponível':
      colorClass = 'bg-green-100 text-green-800';
      break;
    case 'Em uso':
      colorClass = 'bg-blue-100 text-blue-800';
      break;
    case 'Em manutenção':
      colorClass = 'bg-yellow-100 text-yellow-800';
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
// Componente para a Tag de Tipo
function TipoTag({ tipo }: { tipo: string | null }) {
  let colorClass = '';
  switch (tipo) {
    case 'Trator':
      colorClass = 'bg-blue-100 text-blue-800';
      break;
    case 'Implemento':
      colorClass = 'bg-teal-100 text-teal-800';
      break;
    case 'Imóvel':
      colorClass = 'bg-indigo-100 text-indigo-800';
      break;
    default:
      colorClass = 'bg-gray-100 text-gray-800';
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {tipo ?? 'Outro'}
    </span>
  );
}

// O 'params' vem do layout pai e É UMA PROMISE
type Props = {
  params: Promise<{ id: string }>; 
};

// --- Tipagem para os Joins do Supabase ---
// (Isso corrige os erros 'any' e de 'array vs objeto')
type AgendaItem = {
  id: string;
  data_retirada: string | null;
  data_devolucao: string | null;
  finalidade: string | null;
  Patrimonio: { nome_item: string }[] | { nome_item: string } | null;
  Pessoas: { nome_completo: string }[] | { nome_completo: string } | null;
};

type ItemPatrimonio = {
  id: string;
  nome_item: string;
  tipo: string | null;
  data_aquisicao: string | null;
  valor_aquisicao: number | null;
  status: string | null;
  origem: string | null;
};
// --- Fim da Tipagem ---


export default async function PatrimonioPage({ params }: Props) {
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

  // 3. Buscar os Dados (Patrimônio e Agenda)
  
  // Buscar todos os itens de patrimônio
  const { data: patrimonioItens, error: patrimonioError } = await supabase
    .from('Patrimonio')
    .select('*')
    .eq('associacao_id', associacaoId)
    .order('nome_item', { ascending: true })
    .returns<ItemPatrimonio[]>(); // Aplica nossa tipagem

  // Buscar a agenda de uso (com join em Pessoas e Patrimonio)
  const { data: agenda, error: agendaError } = await supabase
    .from('Uso_Patrimonio')
    .select(`
      id,
      data_retirada,
      data_devolucao,
      finalidade,
      Patrimonio ( nome_item ),
      Pessoas ( nome_completo )
    `)
    .eq('associacao_id', associacaoId)
    .order('data_retirada', { ascending: false })
    .returns<AgendaItem[]>(); // Aplica nossa tipagem

  if (patrimonioError) console.error('Erro ao buscar patrimônio:', patrimonioError.message);
  if (agendaError) console.error('Erro ao buscar agenda:', agendaError.message);

  // 4. Calcular Resumos
  const listaPatrimonio = patrimonioItens ?? [];
  const listaAgenda = agenda ?? [];

  // Cards do Topo
  const valorTotal = listaPatrimonio.reduce((acc, p) => acc + (p.valor_aquisicao ?? 0), 0);
  const disponiveis = listaPatrimonio.filter(p => p.status === 'Disponível').length;
  const emUso = listaPatrimonio.filter(p => p.status === 'Em uso').length;
  const emManutencao = listaPatrimonio.filter(p => p.status === 'Em manutenção').length;

  // Cards do Rodapé
  const tratores = listaPatrimonio.filter(p => p.tipo === 'Trator');
  const implementos = listaPatrimonio.filter(p => p.tipo === 'Implemento');

  // 5. Renderizar a Página
  return (
    <div>
      {/* --- Cabeçalho e Botão --- */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Patrimônio e Bens</h1>
          <p className="text-lg text-gray-600">Gestão de maquinário, equipamentos e implementos</p>
        </div>
        <button className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 w-full md:w-auto">
          <Plus className="w-5 h-5" />
          <span>Adicionar Bem</span>
        </button>
      </div>

      {/* --- Cards de Resumo (Topo) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ResumoCard titulo="Valor Total do Patrimônio" valor={formatCurrency(valorTotal)} subtitulo={`${listaPatrimonio.length} itens cadastrados`} Icone={Truck} cor="text-blue" />
        <ResumoCard titulo="Disponíveis" valor={disponiveis.toString()} subtitulo="Prontos para uso" Icone={Package} cor="text-green" />
        <ResumoCard titulo="Em Uso" valor={emUso.toString()} subtitulo="Atualmente agendados" Icone={Calendar} cor="text-indigo" />
        <ResumoCard titulo="Em Manutenção" valor={emManutencao.toString()} subtitulo="Em reparo" Icone={Settings} cor="text-orange" />
      </div>

      {/* --- Tabela Inventário --- */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Inventário de Patrimônio</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome do Bem</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Aquisição</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origem</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* O map aqui é seguro, pois não tem condicionais nem joins complexos */}
              {listaPatrimonio.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.nome_item}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><TipoTag tipo={item.tipo} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{formatDate(item.data_aquisicao)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{formatCurrency(item.valor_aquisicao)}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><StatusTag status={item.status} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{item.origem ?? 'Compra'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2"> {/* space-x-2 para um pouco menos de espaçamento */}
                    <Link href="#" className="inline-flex items-center px-3 py-1 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Ver</Link>
                    <Link href="#" className="inline-flex items-center px-3 py-1 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Agendar</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* --- Tabela Agenda de Uso --- */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Agenda de Uso de Equipamentos</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipamento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Associado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Finalidade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* --- CORREÇÃO AQUI (1/2) ---
                  Filtramos ANTES de mapear para remover itens 'null'
              */}
              {listaAgenda
                .filter(ag => ag.Patrimonio && ag.Pessoas) // Garante que os joins funcionaram
                .map((ag) => {
                  
                // Agora é seguro acessar, tratando como array ou objeto
                const patrimonio = Array.isArray(ag.Patrimonio) ? ag.Patrimonio[0] : ag.Patrimonio;
                const pessoa = Array.isArray(ag.Pessoas) ? ag.Pessoas[0] : ag.Pessoas;

                // Se mesmo assim algo falhar (o que não deve), pulamos
                if (!patrimonio || !pessoa) return null; 

                return (
                  <tr key={ag.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{patrimonio.nome_item}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{pessoa.nome_completo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {formatDateTime(ag.data_retirada)}<br/>
                      até {formatDateTime(ag.data_devolucao)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{ag.finalidade}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href="#" className="inline-flex items-center px-3 py-1 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Detalhes</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* --- Cards de Resumo (Rodapé) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ListaItensCard titulo="Tratores" icone={Truck} itens={tratores} />
        <ListaItensCard titulo="Implementos" icone={Package} itens={implementos} />
      </div>

    </div>
  );
}

// --- Componentes de Card Reutilizáveis ---

function ResumoCard({ titulo, valor, subtitulo, Icone, cor }: { titulo: string, valor: string | number, subtitulo: string, Icone: React.ElementType, cor: string }) {
  const coresIcone: { [key: string]: string } = {
    'text-blue': 'text-blue-600 bg-blue-100',
    'text-green': 'text-green-600 bg-green-100',
    'text-indigo': 'text-indigo-600 bg-indigo-100',
    'text-orange': 'text-orange-600 bg-orange-100',
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

// Componente do card do rodapé (corrigido)
function ListaItensCard({ titulo, icone: Icone, itens }: { titulo: string, icone: React.ElementType, itens: ItemPatrimonio[] }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center space-x-2 mb-4">
        <Icone className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-800">{titulo} ({itens.length})</h3>
      </div>
      <ul className="space-y-3">
        {itens.map(item => (
          <li key={item.id} className="flex justify-between items-center text-sm">
            <div>
              <p className="font-medium text-gray-800">{item.nome_item}</p>
              <p className="text-xs text-gray-500">{formatCurrency(item.valor_aquisicao)}</p>
            </div>
            <StatusTag status={item.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}
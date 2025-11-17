import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Plus, Mail, Phone, Search, DollarSign, Users, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

type Props = {
  params: Promise<{ id: string }>; 
};


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

// Helper para formatar data (ex: 14/01/2020)
function formatDate(dateString: string | null) {
  if (!dateString) return 'N/D';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

// Componente para a Tag de Status (Ativo, Inadimplente)
function StatusTag({ situacao }: { situacao: string }) {
  let colorClass = '';
  switch (situacao) {
    case 'Ativo':
      colorClass = 'bg-green-100 text-green-800';
      break;
    case 'Inadimplente':
      colorClass = 'bg-red-100 text-red-800';
      break;
    case 'Inativo':
    case 'Suspenso':
      colorClass = 'bg-yellow-100 text-yellow-800';
      break;
    default:
      colorClass = 'bg-gray-100 text-gray-800';
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {situacao}
    </span>
  );
}

// Componente para a Tag de Categoria (Fundador, Efetivo)
function CategoriaTag({ categoria }: { categoria: string | null }) {
  if (!categoria) return null;
  let colorClass = '';
  switch (categoria) {
    case 'Fundador':
      colorClass = 'bg-purple-100 text-purple-800';
      break;
    case 'Efetivo':
      colorClass = 'bg-blue-100 text-blue-800';
      break;
    case 'Contribuinte':
      colorClass = 'bg-teal-100 text-teal-800';
      break;
    default:
      colorClass = 'bg-gray-100 text-gray-800';
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {categoria}
    </span>
  );
}

// Componente para os Cards de Resumo
function ResumoCard({ titulo, valor, subtitulo }: { titulo: string, valor: string | number, subtitulo: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <p className="text-sm font-medium text-gray-500">{titulo}</p>
      <p className="text-3xl font-light text-gray-900 mt-1">{valor}</p>
      <p className="text-xs text-gray-400 mt-2">{subtitulo}</p>
    </div>
  );
}


// --- A Página Principal ---

export default async function AssociadosPage({ params }: Props) {
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

  // 3. Buscar os Dados dos Membros (com join em Pessoas)
  const { data: membros, error } = await supabase
    .from('Membros')
    .select(`
      id,
      categoria,
      situacao,
      valor_mensalidade_base,
      data_admissao,
      Pessoas ( nome_completo, cpf, endereco, telefone, email )
    `)
    .eq('associacao_id', associacaoId);

  if (error) {
    console.error('Erro ao buscar membros:', error.message);
  }

  // 4. Calcular Resumos para os Cards
  const listaMembros = membros ?? [];
  
  const totalAssociados = listaMembros.length;
  const ativos = listaMembros.filter(m => m.situacao === 'Ativo').length;
  const inadimplentes = listaMembros.filter(m => m.situacao === 'Inadimplente').length;
  
  const receitaEsperada = listaMembros
    .filter(m => m.situacao === 'Ativo')
    .reduce((acc, m) => acc + (m.valor_mensalidade_base ?? 0), 0);

  const fundadores = listaMembros.filter(m => m.categoria === 'Fundador').length;
  const efetivos = listaMembros.filter(m => m.categoria === 'Efetivo').length;
  const contribuintes = listaMembros.filter(m => m.categoria === 'Contribuinte').length;


  // 5. Renderizar a Página
  return (
    <div>
      {/* --- Cabeçalho e Botão --- */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Controle de Associados</h1>
          <p className="text-lg text-gray-600">Gestão completa dos membros da associação</p>
        </div>
        <button className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700">
          <Plus className="w-5 h-5" />
          <span>Novo Associado</span>
        </button>
      </div>

      {/* --- Cards de Resumo (Topo) --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <ResumoCard 
          titulo="Total de Associados" 
          valor={totalAssociados} 
          subtitulo={`${totalAssociados} cadastrados no sistema`} />
        <ResumoCard 
          titulo="Ativos" 
          valor={ativos} 
          subtitulo={`${ativos} em dia com obrigações`} />
        <ResumoCard 
          titulo="Inadimplentes" 
          valor={inadimplentes} 
          subtitulo={`${inadimplentes} com mensalidades atrasadas`} />
        <ResumoCard 
          titulo="Receita Mensal Esperada" 
          valor={formatCurrency(receitaEsperada)} 
          subtitulo={`baseado em ${ativos} ativos`} />
      </div>

      {/* --- Tabela Principal --- */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Lista de Associados</h2>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Buscar associado..." 
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Associado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mensalidade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Membro desde</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {listaMembros.map((membro) => {
                // Tratamos 'Pessoas' como um array e pegamos o primeiro item [0]
                const pessoa = (Array.isArray(membro.Pessoas) ? membro.Pessoas[0] : membro.Pessoas) as 
                  { nome_completo: string, cpf: string, endereco: string, email: string, telefone: string };

                if (!pessoa) return null;

                return (
                  <tr key={membro.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{pessoa.nome_completo}</div>
                      <div className="text-sm text-gray-500">{pessoa.cpf}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{pessoa.endereco}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <CategoriaTag categoria={membro.categoria} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusTag situacao={membro.situacao} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      <div className="flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-gray-400" /> <span>{pessoa.telefone}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Mail className="w-3 h-3 text-gray-400" /> <span>{pessoa.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {formatCurrency(membro.valor_mensalidade_base)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {formatDate(membro.data_admissao)}
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href="#" className="inline-flex items-center px-3 py-1 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Editar</Link>
                      <Link href="#" className="inline-flex items-center px-3 py-1 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Histórico</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Estrutura (Baixo) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResumoCard 
          titulo="Fundadores" 
          valor={fundadores} 
          subtitulo="Membros fundadores da associação" />
        <ResumoCard 
          titulo="Efetivos" 
          valor={efetivos} 
          subtitulo="Membros com direito a voto" />
        <ResumoCard 
          titulo="Contribuintes" 
          valor={contribuintes} 
          subtitulo="Apoiadores da associação" />
      </div>

    </div>
  );
}
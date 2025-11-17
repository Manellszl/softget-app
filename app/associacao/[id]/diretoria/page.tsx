import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Plus, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

type Props = {
  params: Promise<{ id: string }>; 
};

function formatDate(dateString: string | null) {
  if (!dateString) return 'N/D';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function CategoriaTag({ categoria }: { categoria: string }) {
  let colorClass = '';
  switch (categoria) {
    case 'Executivo':
      colorClass = 'bg-blue-100 text-blue-800';
      break;
    case 'Financeiro':
      colorClass = 'bg-green-100 text-green-800';
      break;
    case 'Conselho Fiscal':
      colorClass = 'bg-purple-100 text-purple-800';
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


export default async function DiretoriaPage({ params }: Props) {
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

  // Buscar os Dados da Diretoria
  const { data: mandatos, error } = await supabase
    .from('Mandatos')
    .select(`
      id,
      cargo,
      categoria,
      data_inicio,
      data_fim,
      descricao_mandato,
      Pessoas ( nome_completo, cpf, email, telefone, endereco )
    `)
    .eq('associacao_id', associacaoId)
    .eq('ativo', true);

  if (error) {
    console.error('Erro ao buscar diretoria:', error.message);
  }

  // Calcular Resumos e Agrupar
  const membrosFiltrados = mandatos ?? [];

  const executivo = membrosFiltrados.filter(m => m.categoria === 'Executivo');
  const financeiro = membrosFiltrados.filter(m => m.categoria === 'Financeiro');
  const conselho = membrosFiltrados.filter(m => m.categoria === 'Conselho Fiscal');

  const descricaoMandato = membrosFiltrados[0]?.descricao_mandato ?? 'Mandato Atual';

  // Renderizar a Página
  return (
    <div>
      {/* --- Cabeçalho e Botão --- */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Diretoria e Gestão</h1>
          <p className="text-lg text-gray-600">Gerenciamento dos membros da diretoria e conselhos</p>
        </div>
        <button className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700">
          <Plus className="w-5 h-5" />
          <span>Adicionar Membro</span>
        </button>
      </div>

      {/* --- Cards de Resumo (Topo) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ResumoCard titulo="Executivo" valor={executivo.length} />
        <ResumoCard titulo="Financeiro" valor={financeiro.length} />
        <ResumoCard titulo="Conselho Fiscal" valor={conselho.length} />
      </div>

      {/* --- Tabela Principal --- */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Membros da Diretoria</h2>
        <p className="text-sm text-gray-500 mb-6">{descricaoMandato}</p>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mandato</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {membrosFiltrados.map((membro) => {
                
                const pessoa = (Array.isArray(membro.Pessoas) ? membro.Pessoas[0] : membro.Pessoas) as 
                  { nome_completo: string, cpf: string, email: string, telefone: string };

                if (!pessoa) return null;

                return (
                  <tr key={membro.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{pessoa.nome_completo}</div>
                      <div className="text-sm text-gray-500">{pessoa.cpf}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{membro.cargo}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <CategoriaTag categoria={membro.categoria} />
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
                      {formatDate(membro.data_inicio)}<br/>
                      até {formatDate(membro.data_fim)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2"> {/* space-x-2 para um pouco menos de espaçamento */}
                    <Link href="#" className="inline-flex items-center px-3 py-1 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Ver Detalhes</Link>
                  </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Estrutura (Baixo) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <EstruturaCard titulo="Estrutura Executiva" membros={executivo} />
        <EstruturaCard titulo="Área Financeira" membros={financeiro} />
      </div>

    </div>
  );
}

// --- Componentes de Card Reutilizáveis ---

function ResumoCard({ titulo, valor }: { titulo: string, valor: number }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <p className="text-sm font-medium text-gray-500">{titulo}</p>
      <p className="text-3xl font-light text-gray-900 mt-1">{valor}</p>
      <p className="text-xs text-gray-400 mt-2">membros ativos</p>
    </div>
  );
}

function EstruturaCard({ titulo, membros }: { titulo: string, membros: any[] }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{titulo}</h3>
      <ul className="space-y-3">
        {membros.map(m => {
          const pessoa = (Array.isArray(m.Pessoas) ? m.Pessoas[0] : m.Pessoas) as 
            { nome_completo: string, endereco: string };
          
          if (!pessoa) return null;

          return (
            <li key={m.id}>
              <p className="font-semibold text-gray-900">{m.cargo}:</p>
              <p className="text-sm text-gray-700">{pessoa.nome_completo}</p>
              <p className="text-sm text-gray-500">{pessoa.endereco}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
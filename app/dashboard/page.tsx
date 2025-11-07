import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { signOut } from './actions';
import Link from 'next/link';

export const revalidate = 0;

type Associacao = {
  id: string;
  nome_associacao: string;
};

export default async function DashboardPage() {
  const cookieStore = cookies();

  // Cria cliente Supabase com suporte a SSR
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return (await cookieStore).get(name)?.value;
        },
        async set() {},
        async remove() {},
      },
    }
  );

  // Obtém usuário autenticado (forma segura)
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user || userError) {
    redirect('/');
  }

  // Busca permissões do usuário
  const { data: permissoes, error: permissoesError } = await supabase
    .from('Permissoes_Usuarios')
    .select('associacao_id')
    .eq('user_id', user.id);

  if (permissoesError) {
    console.error('Erro ao buscar permissões:', permissoesError.message);
  }

  // Busca associações relacionadas às permissões
  let associacoes: Associacao[] = [];

  if (permissoes && permissoes.length > 0) {
    const associacaoIds = permissoes.map(p => p.associacao_id);

    const { data: associacoesDiretas, error: assocError } = await supabase
      .from('Associacoes')
      .select('id, nome_associacao')
      .in('id', associacaoIds);

    if (!assocError && associacoesDiretas) {
      associacoes = associacoesDiretas as Associacao[];
    }
  }

  // Renderização
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 text-gray-900">
      <div className="w-full max-w-lg rounded-lg bg-white p-8 shadow-2xl border border-gray-200">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Minhas Associações</h1>
          <form action={signOut}>
            <button 
              type="submit" 
              className="rounded-md bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300"
            >
              Sair
            </button>
          </form>
        </div>

        {associacoes.length > 0 ? (
          <ul className="space-y-4">
            {associacoes.map((a) => (
              <li key={a.id}>
                <Link 
                  href={`/associacao/${a.id}`} 
                  className="block rounded-lg bg-gray-100 p-5 text-xl font-semibold text-gray-800 hover:bg-gray-200 transition-colors"
                >
                  {a.nome_associacao}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500">
            Você ainda não foi convidado para gerenciar nenhuma associação.
          </p>
        )}

        <p className="mt-8 text-center text-xs text-gray-600">
          Logado como: {user.email}
        </p>
      </div>
    </div>
  );
}

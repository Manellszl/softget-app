import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { signOut } from './actions'; 
import Link from 'next/link';

export default async function DashboardPage() {
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return (await cookies()).get(name)?.value;
        },
        async set() {},
        async remove() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/'); 
  }

  const { data: permissoes, error } = await supabase
    .from('Permissoes_Usuarios')
    .select(`
      associacao_id,
      Associacoes ( id, nome_associacao ) 
    `)
    .eq('user_id', user.id);

  if (error) {
    console.error('Erro ao buscar permissões:', error.message);
  }

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
        
        {permissoes && permissoes.length > 0 ? (
          <ul className="space-y-4">
            {permissoes.map((p) => (
              p.Associacoes && Array.isArray(p.Associacoes) && p.Associacoes.length > 0 ? (
                <li key={p.associacao_id}>
                  <Link 
                    href={`/associacao/${p.Associacoes[0].id}`} 
                    className="block rounded-lg bg-gray-100 p-5 text-xl font-semibold text-gray-800 hover:bg-gray-200 transition-colors"
                  >
                    {p.Associacoes[0].nome_associacao}
                  </Link>
                </li>
              ) : null
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
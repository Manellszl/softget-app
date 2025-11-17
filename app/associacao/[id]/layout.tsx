import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SideNav from './_components/SideNav';
import { ReactNode } from 'react';
import { signOut } from '../../dashboard/actions'; 

export const revalidate = 0;

// --- CORREÇÃO #1: Tipagem do 'params' como Promise ---
type Params = Promise<{ id: string }>; 

type Props = {
  children: ReactNode;
  params: Params; // <-- Aplicamos o tipo correto
};

export default async function AssociacaoLayout({ children, params }: Props) {
  
  // --- CORREÇÃO #2: Desembrulhar o 'params' com 'await' ---
  const { id: associacaoId } = await params; 
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // --- CORREÇÃO #3: 'cookies()' também é async ---
        async get(name: string) { 
          const cookieStore = await cookies();
          return cookieStore.get(name)?.value; 
        },
        async set() {},
        async remove() {},
      },
    }
  );

  // 1. Obter o usuário (seguro)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/'); 
  }
  
  // 2. Verificação de permissão (agora 'associacaoId' é um UUID válido)
  const { data: permissao, error } = await supabase
    .from('Permissoes_Usuarios')
    .select(`
      papel,
      Associacoes ( nome_associacao ) 
    `) 
    .eq('user_id', user.id)
    .eq('associacao_id', associacaoId)
    .single();

  if (error || !permissao) {
    console.error('Acesso negado:', error?.message);
    redirect('/dashboard');
  }

  const papelDoUsuario = permissao.papel;
  
  // Lógica para extrair o nome da associação com segurança
  let nomeAssociacao = 'Associação'; 
  if (permissao.Associacoes) {
    if (Array.isArray(permissao.Associacoes)) {
      nomeAssociacao = permissao.Associacoes[0]?.nome_associacao ?? nomeAssociacao;
    } 
    else if (typeof permissao.Associacoes === 'object') {
      nomeAssociacao = (permissao.Associacoes as { nome_associacao: string }).nome_associacao;
    }
  }

  // 3. Renderizar o Layout
  return (
    <div className="flex h-screen bg-gray-100"> 
      
      <SideNav 
        papel={papelDoUsuario} 
        associacaoId={associacaoId} 
        nomeAssociacao={nomeAssociacao} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        
        <header className="flex justify-end items-center p-4 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {user.email}
            </span>
            <form action={signOut}>
              <button 
                type="submit" 
                className="rounded-md bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300"
              >
                Sair
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {children} 
        </main>

      </div>
    </div>
  );
}
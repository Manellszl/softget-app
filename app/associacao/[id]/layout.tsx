import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';
import { signOut } from '../../dashboard/actions'; 
// Importa o novo invólucro
import ResponsiveLayout from './_components/ResponsiveLayout';

export const revalidate = 0;

type Params = Promise<{ id: string }>; 

type Props = {
  children: ReactNode;
  params: Params;
};

// Este componente permanece no Servidor
export default async function AssociacaoLayout({ children, params }: Props) {
  
  const { id: associacaoId } = await params; 
  
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

  // 1. Obter o usuário (seguro)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/'); 
  }
  
  // 2. Buscar dados (permissão e nome)
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
  
  let nomeAssociacao = 'Associação'; 
  if (permissao.Associacoes) {
    if (Array.isArray(permissao.Associacoes)) {
      nomeAssociacao = permissao.Associacoes[0]?.nome_associacao ?? nomeAssociacao;
    } 
    else if (typeof permissao.Associacoes === 'object') {
      nomeAssociacao = (permissao.Associacoes as { nome_associacao: string }).nome_associacao;
    }
  }

  // 3. Renderizar o Layout (passando os dados para o Componente de Cliente)
  return (
    <ResponsiveLayout
      papel={papelDoUsuario}
      associacaoId={associacaoId}
      nomeAssociacao={nomeAssociacao}
      emailUsuario={user.email ?? ''}
      signOutAction={signOut}
    >
      {children}
    </ResponsiveLayout>
  );
}
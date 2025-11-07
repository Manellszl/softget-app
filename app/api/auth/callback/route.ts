import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function POST(request: Request) {
  const { event, session } = await request.json();

  // Criamos a resposta para poder manipular cookies diretamente
  const response = NextResponse.json({ success: true });

  // Criar cliente Supabase com controle total sobre cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.headers.get('cookie')
            ?.match(new RegExp(`${name}=([^;]*)`))
            ?.[1];
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set(name, value, options);
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );

  // 🧠 Atualiza a sessão quando o usuário faz login
  if (event === 'SIGNED_IN' && session) {
    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
  }

  // 🚪 Limpa os cookies quando o usuário faz logout
  if (event === 'SIGNED_OUT') {
    await supabase.auth.signOut();
  }

  return response;
}

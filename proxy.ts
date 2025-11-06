import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  // 1. Cria uma resposta inicial
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Configuração do Supabase (o boilerplate oficial)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // 3. Pega a sessão do usuário (se existir)
  const { data: { session } } = await supabase.auth.getSession();

  // 4. Lógica de Redirecionamento 
  const isAuthPage = request.nextUrl.pathname === '/';

  // Se o usuário NÃO está logado E está tentando acessar algo que NÃO é a página de login
  if (!session && !isAuthPage) {
  
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Se o usuário ESTÁ logado E está tentando acessar a página de login
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  return response;
}

export const config = {
  matcher: [
    '/', 
    '/dashboard/:path*',
  ],
};
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { event, session } = await request.json();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return (await cookies()).get(name)?.value;
        },
        async set(name: string, value: string, options: CookieOptions) {
          (await cookies()).set(name, value, options);
        },
        async remove(name: string, options: CookieOptions) {
          (await cookies()).delete(name);
        },
      },
    }
  );

  if (event === 'SIGNED_IN') {
    // Se for um login, define a sessão. Isso SALVA o cookie.
    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
  } 

  return NextResponse.json({ ok: true });
}
'use client'; 

import { useState, useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createBrowserClient } from '@supabase/ssr';

export default function LoginPage() {
  
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        fetch('/api/auth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event, session }),
        }).then(() => {
          window.location.href = '/dashboard';
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // --- MUDANÇA AQUI ---
  const theme = 'light'; // Trocado de 'dark' para 'light'

  return (
    // --- MUDANÇA AQUI ---
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      {/* --- MUDANÇA AQUI --- */}
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-2xl border border-gray-200">
        {/* --- MUDANÇA AQUI --- */}
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-900">
          SoftGet Login
        </h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }} 
          theme={theme}
          providers={['google']} 
          localization={{
            variables: {
            }
          }}
        />
      </div>
    </div>
  );
}
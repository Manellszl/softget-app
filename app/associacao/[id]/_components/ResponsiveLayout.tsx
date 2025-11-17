'use client'; // Este componente gerencia o estado (menu aberto/fechado)

import { useState, ReactNode } from 'react';
import SideNav from './SideNav'; // Nosso menu lateral
import { Menu, X } from 'lucide-react';

type Props = {
  children: ReactNode;
  // Props que recebemos do nosso layout de servidor
  papel: string;
  associacaoId: string;
  nomeAssociacao: string;
  emailUsuario: string;
  signOutAction: () => Promise<never>; // Ação de Sair
};

export default function ResponsiveLayout({
  children,
  papel,
  associacaoId,
  nomeAssociacao,
  emailUsuario,
  signOutAction
}: Props) {
  
  // Estado para controlar o menu mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      
      {/* 1. Menu Lateral (Desktop) */}
      <div className="hidden md:flex"> {/* Oculto em mobile, visível em desktop */}
        <SideNav 
          papel={papel} 
          associacaoId={associacaoId} 
          nomeAssociacao={nomeAssociacao} 
        />
      </div>

      {/* 2. Menu Lateral (Mobile - Overlay) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* O menu em si */}
          <SideNav 
            papel={papel} 
            associacaoId={associacaoId} 
            nomeAssociacao={nomeAssociacao} 
          />
          {/* Fundo escuro clicável para fechar */}
          <div 
            className="flex-1 bg-black/50" 
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <button className="absolute top-4 right-4 text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Conteúdo Principal (Header + Main) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Cabeçalho */}
        <header className="flex justify-between items-center p-4 bg-white border-b border-gray-200">
          
          {/* Botão Hambúrguer (Apenas Mobile) */}
          <button 
            className="text-gray-700 md:hidden"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Espaçador (para centralizar o botão de sair em mobile) */}
          <div className="md:hidden"></div> 

          {/* Info do Usuário e Botão Sair (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {emailUsuario}
            </span>
            <form action={signOutAction}>
              <button 
                type="submit" 
                className="rounded-md bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300"
              >
                Sair
              </button>
            </form>
          </div>
          
          {/* Botão Sair (Mobile - Apenas o botão) */}
          <form action={signOutAction} className="md:hidden">
            <button 
              type="submit" 
              className="rounded-md bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300"
            >
              Sair
            </button>
          </form>

        </header>

        {/* Área de Conteúdo */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children} 
        </main>

      </div>
    </div>
  );
}
'use client'; // Este é um Componente de Cliente

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Library, 
  Banknote, 
  Truck, 
  FileText, 
  BarChart2 
} from 'lucide-react';

// Define os links e quais papéis podem vê-los
const navLinks = [
  { nome: 'Dashboard', href: '', icon: LayoutDashboard, papeis: ['CONTADOR', 'PRESIDENTE', 'TESOUREIRO', 'SECRETARIO', 'ASSOCIADO'] },
  { nome: 'Diretoria', href: '/diretoria', icon: Users, papeis: ['CONTADOR', 'PRESIDENTE', 'SECRETARIO'] },
  { nome: 'Associados', href: '/associados', icon: Library, papeis: ['CONTADOR', 'PRESIDENTE', 'SECRETARIO'] },
  { nome: 'Financeiro', href: '/financeiro', icon: Banknote, papeis: ['CONTADOR', 'PRESIDENTE', 'TESOUREIRO'] },
  { nome: 'Patrimônio', href: '/patrimonio', icon: Truck, papeis: ['CONTADOR', 'PRESIDENTE', 'TESOUREIRO'] },
  { nome: 'Obrigações', href: '/obrigacoes', icon: FileText, papeis: ['CONTADOR', 'PRESIDENTE', 'SECRETARIO'] },
  { nome: 'Relatórios', href: '/relatorios', icon: BarChart2, papeis: ['CONTADOR', 'PRESIDENTE', 'TESOUREIRO'] },
];

type Props = {
  papel: string;
  associacaoId: string;
  nomeAssociacao: string;
};

export default function SideNav({ papel, associacaoId, nomeAssociacao }: Props) {
  const pathname = usePathname();

  const linksVisiveis = navLinks.filter(link => link.papeis.includes(papel));

  return (
    // --- 1. MUDANÇA AQUI: Fundo branco e borda lateral ---
    <nav className="w-64 h-screen bg-white text-gray-900 flex flex-col p-4 border-r border-gray-200 flex-shrink-0">
      
      {/* --- 2. MUDANÇA AQUI: Título com 2 linhas (como no Figma) --- */}
      <div className="px-4 mb-10">
        <div className="text-2xl font-black text-gray-900 truncate" title={nomeAssociacao}>
          {nomeAssociacao}
        </div>
        <div className="text-sm font-medium text-gray-500">
          Sistema de Gestão
        </div>
      </div>
      {/* --- FIM DA MUDANÇA --- */}

      <ul className="space-y-2">
        {linksVisiveis.map((link) => {
          const fullHref = `/associacao/${associacaoId}${link.href}`;
          
          const isActive = link.href === '' 
            ? pathname === `/associacao/${associacaoId}` 
            : pathname.startsWith(fullHref);

          return (
            <li key={link.nome}>
              <Link
                href={fullHref}
                className={`
                  flex items-center space-x-4 p-3 rounded-lg transition-colors
                  
                  ${/* --- 3. MUDANÇA AQUI: Estilos de link Ativo e Inativo --- */ ''}
                  ${isActive 
                    ? 'bg-gray-900 text-white' // Fundo escuro e texto branco (Ativo)
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' // Texto cinza, hover claro (Inativo)
                  }
                `}
              >
                <link.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                {/* 'text-sm' (menor)
  'font-medium' (500) se estiver ativo
  'font-normal' (400) se estiver inativo
*/}
<span className={`text-sm ${isActive ? 'font-medium' : 'font-normal'}`}>
  {link.nome}
</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
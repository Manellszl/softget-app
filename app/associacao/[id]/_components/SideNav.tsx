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
  BarChart2,
  X
} from 'lucide-react';

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
  onLinkClick?: () => void;
  onCloseMenu?: () => void; 
};

export default function SideNav({ 
  papel, 
  associacaoId, 
  nomeAssociacao, 
  onLinkClick, 
  onCloseMenu 
}: Props) {
  const pathname = usePathname();

  const linksVisiveis = navLinks.filter(link => link.papeis.includes(papel));

  return (
    <nav className="w-64 h-screen bg-white text-gray-900 flex flex-col p-4 border-r border-gray-200 shrink-0">
      
      {/* --- 3. Atualiza o Título (Adiciona o botão 'X') --- */}
      <div className="flex justify-between items-center mb-10 px-4">
        <div className="min-w-0"> 
          <div className="text-2xl font-black text-gray-900 truncate" title={nomeAssociacao}>
            {nomeAssociacao}
          </div>
          <div className="text-sm font-medium text-gray-500">
            Sistema de Gestão
          </div>
        </div>
        {/* Adiciona o 'X' (visível apenas em mobile) */}
        {onCloseMenu && (
          <button onClick={onCloseMenu} className="md:hidden text-gray-500 hover:text-gray-800">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

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
                onClick={onLinkClick}
                className={`
                  flex items-center space-x-4 p-3 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-gray-900 text-white' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <link.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                <span className={`text-sm ${isActive ? 'font-semibold' : 'font-normal'}`}>
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
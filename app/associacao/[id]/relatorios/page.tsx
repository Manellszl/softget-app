import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { 
  Plus, 
  Eye, 
  Download, 
  Users, 
  Landmark, 
  Truck, 
  Percent,
  FileText,
  BarChart,
  AlertTriangle,
  Calendar,
  Building,
  PiggyBank,
  Info
} from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

// --- Helpers ---
function formatCurrency(value: number | null) {
  if (value === null || isNaN(value)) value = 0;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// O 'params' vem do layout pai e É UMA PROMISE
type Props = {
  params: Promise<{ id: string }>; 
};

// --- Tipagens para os dados ---
type Membro = {
  situacao: string;
  valor_mensalidade_base: number | null;
};
type Lancamento = {
  valor: number;
};
type ItemPatrimonio = {
  valor_aquisicao: number | null;
  status: string | null;
};
type Associacao = {
  id: string;
  nome_associacao: string;
};


export default async function RelatoriosPage({ params }: Props) {
  // 1. Obter o ID da Associação
  const { id: associacaoId } = await params;

  // 2. Criar o Cliente Supabase
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

  // 3. Buscar os Dados
  const [membrosRes, lancamentosRes, patrimonioRes] = await Promise.all([
    supabase
      .from('Membros')
      .select('situacao, valor_mensalidade_base')
      .eq('associacao_id', associacaoId)
      .returns<Membro[]>(),
    supabase
      .from('Lancamentos_Financeiros')
      .select('valor')
      .eq('associacao_id', associacaoId)
      .returns<Lancamento[]>(),
    
    supabase
      .from('Patrimonio')
      .select('valor_aquisicao, status') 
      .eq('associacao_id', associacaoId)
      .returns<ItemPatrimonio[]>()
  ]);

  const membros = membrosRes.data ?? [];
  const lancamentos = lancamentosRes.data ?? [];
  const patrimonio = patrimonioRes.data ?? [];

  // 4. Calcular Resumos para os Cards
  
  // Resumo Executivo
  const totalAssociados = membros.length;
  const ativos = membros.filter(m => m.situacao === 'Ativo').length;
  const taxaAdimplencia = totalAssociados > 0 ? (ativos / totalAssociados) * 100 : 100;

  const receitasTotal = lancamentos.filter(l => l.valor > 0).reduce((acc, l) => acc + l.valor, 0);
  const despesasTotal = lancamentos.filter(l => l.valor < 0).reduce((acc, l) => acc + l.valor, 0);
  const saldoFinanceiro = receitasTotal + despesasTotal;

  const patrimonioTotal = patrimonio.reduce((acc, p) => acc + (p.valor_aquisicao ?? 0), 0);
  
  // Outros dados (para os cards de relatório)
  const inadimplentes = membros.filter(m => m.situacao === 'Inadimplente').length;
  const mensalidadeEsperada = membros
    .filter(m => m.situacao === 'Ativo')
    .reduce((acc, m) => acc + (m.valor_mensalidade_base ?? 0), 0) ?? 0;
  
  const disponiveis = patrimonio.filter(p => p.status === 'Disponível').length;


  // 5. Renderizar a Página
  return (
    <div>
      {/* --- Cabeçalho --- */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Relatórios e Indicadores</h1>
          <p className="text-lg text-gray-600">Demonstrativos e análises para tomada de decisão</p>
        </div>
      </div>

      {/* --- Card Resumo Executivo --- */}
      <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-lg font-semibold text-blue-800 mb-4">Resumo Executivo</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <InfoItem titulo="Associados Ativos" valor={`${ativos} de ${totalAssociados}`} Icone={Users} />
          <InfoItem titulo="Saldo Financeiro" valor={formatCurrency(saldoFinanceiro)} Icone={Landmark} />
          <InfoItem titulo="Patrimônio Total" valor={formatCurrency(patrimonioTotal)} Icone={Truck} />
          <InfoItem titulo="Taxa de Adimplência" valor={`${taxaAdimplencia.toFixed(0)}%`} Icone={Percent} />
        </div>
      </div>

      {/* --- Grade de Relatórios --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <ReportCard 
          titulo="Demonstrativo Financeiro Mensal" 
          subtitulo="Relatório completo de receitas e despesas do mês atual."
          Icone={BarChart} cor="text-green-600"
        >
          <DataPonto titulo="Receitas" valor={formatCurrency(receitasTotal)} />
          <DataPonto titulo="Despesas" valor={formatCurrency(despesasTotal)} />
          <DataPonto titulo="Saldo" valor={formatCurrency(saldoFinanceiro)} />
        </ReportCard>
        
        <ReportCard 
          titulo="Relatório de Inadimplência" 
          subtitulo="Lista de associados com pagamentos em atraso."
          Icone={AlertTriangle} cor="text-red-600"
        >
          <DataPonto titulo="Inadimplentes" valor={inadimplentes} />
          <DataPonto titulo="Percentual" valor={`${(inadimplentes/totalAssociados * 100).toFixed(0)}%`} />
        </ReportCard>

        <ReportCard 
          titulo="Controle de Utilização de Equipamentos" 
          subtitulo="Histórico de uso de tratores e implementos."
          Icone={Calendar} cor="text-blue-600"
        >
          <DataPonto titulo="Total Equipamentos" valor={patrimonio.length} />
          <DataPonto titulo="Disponíveis" valor={disponiveis} />
        </ReportCard>

        <ReportCard 
          titulo="Prestação de Contas - Associados" 
          subtitulo="Relatório trimestral para apresentação aos associados."
          Icone={Building} cor="text-purple-600"
        >
          <DataPonto titulo="Período" valor="Trimestre Atual" />
        </ReportCard>

        <ReportCard 
          titulo="Balanço Patrimonial" 
          subtitulo="Demonstrativo completo do patrimônio da associação."
          Icone={Landmark} cor="text-orange-600"
        >
          <DataPonto titulo="Patrimônio" valor={formatCurrency(patrimonioTotal)} />
        </ReportCard>
        
        <ReportCard 
          titulo="Relatório de Mensalidades" 
          subtitulo="Análise de arrecadação de mensalidades."
          Icone={PiggyBank} cor="text-teal-600"
        >
          <DataPonto titulo="Arrecadado" valor={formatCurrency(0)} /> {/* (Precisaria de mais lógica) */}
          <DataPonto titulo="Esperado" valor={formatCurrency(mensalidadeEsperada)} />
        </ReportCard>
      </div>

      {/* --- Seção de Exportação --- */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Exportação de Dados</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ExportCard titulo="Exportar Associados" subtitulo="Baixar CSV" />
          <ExportCard titulo="Exportar Financeiro" subtitulo="Baixar PDF" />
          <ExportCard titulo="Exportar Patrimônio" subtitulo="Baixar PDF" />
        </div>
      </div>
      
      {/* --- Dica de Compliance --- */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <div className="flex items-center space-x-2 mb-4">
          <Info className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-800">Sobre os Relatórios</h3>
        </div>
        <ul className="space-y-2 text-sm text-blue-700 list-disc list-inside">
          <li>**Demonstrativos Financeiros:** Deve ser apresentado mensalmente aos associados...</li>
          <li>**Prestação de Contas:** Obrigatória para verbas governamentais...</li>
          <li>**Balanço Patrimonial:** Documento anual obrigatório...</li>
        </ul>
      </div>

    </div>
  );
}

// --- Componentes de Card Reutilizáveis ---

// Botão Visualizar (Estilo do Figma)
function ButtonVisualizar({ href }: { href: string }) {
  return (
    <Link href={href} className="inline-flex items-center px-3 py-1 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
      <Eye className="w-4 h-4 mr-2" />
      Visualizar
    </Link>
  );
}

// Botão Exportar (Estilo do Figma)
function ButtonExportar({ href }: { href: string }) {
  return (
    <Link href={href} className="inline-flex items-center px-3 py-1 bg-gray-900 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-gray-700">
      <Download className="w-4 h-4 mr-2" />
      Exportar PDF
    </Link>
  );
}

// Card para a grade principal de 6 relatórios
function ReportCard({ titulo, subtitulo, Icone, cor, children }: { titulo: string, subtitulo: string, Icone: React.ElementType, cor: string, children: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center space-x-3 mb-3">
        <Icone className={`w-6 h-6 ${cor}`} />
        <h3 className="text-lg font-semibold text-gray-800">{titulo}</h3>
      </div>
      <p className="text-sm text-gray-500 mb-4">{subtitulo}</p>
      <div className="mb-6 space-y-2">
        {children}
      </div>
      <div className="flex items-center space-x-3">
        <ButtonVisualizar href="#" />
        <ButtonExportar href="#" />
      </div>
    </div>
  );
}

// Item de dado para o ReportCard
function DataPonto({ titulo, valor }: { titulo: string, valor: string | number }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-600">{titulo}:</span>
      <span className="font-medium text-gray-900">{valor}</span>
    </div>
  );
}

// Card para o Resumo Executivo (azul)
function InfoItem({ titulo, valor, Icone }: { titulo: string, valor: string | number, Icone: React.ElementType }) {
  return (
    <div className="flex items-center space-x-3">
      <div className="p-2 rounded-full bg-blue-100">
        <Icone className="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-blue-700">{titulo}</p>
        <p className="text-xl font-semibold text-blue-900">{valor}</p>
      </div>
    </div>
  );
}

// Card para a seção de Exportação (rodapé)
function ExportCard({ titulo, subtitulo }: { titulo: string, subtitulo: string }) {
  return (
    <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg flex justify-between items-center">
      <div>
        <p className="font-semibold text-gray-800">{titulo}</p>
        <p className="text-sm text-gray-500">{subtitulo}</p>
      </div>
      <Download className="w-5 h-5 text-gray-400" />
    </div>
  );
}
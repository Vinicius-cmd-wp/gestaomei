
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import FinancialChart from '../../components/dashboard/FinancialChart';
import MEIAlerts from '../../components/dashboard/MEIAlerts';
import QuickActions from '../../components/dashboard/QuickActions';
import NovaReceitaModal from '../../components/modals/NovaReceitaModal';
import NovaDespesaModal from '../../components/modals/NovaDespesaModal';
import NovaContaPagarModal from '../../components/modals/NovaContaPagarModal';
import NovaContaReceberModal from '../../components/modals/NovaContaReceberModal';

interface DashboardData {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  receitasRecebidas: number;
  receitasPendentes: number;
  despesasPagas: number;
  despesasPendentes: number;
  contasPagar: number;
  contasReceber: number;
}

interface ResumoData {
  receitasMes: number;
  receitasMesAnterior: number;
  despesasMes: number;
  despesasMesAnterior: number;
  lucroMes: number;
  faturamentoAnual: number;
  contasPagarProximas: any[];
  contasReceberProximas: any[];
}

interface ChartData {
  mes: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNovaReceitaModal, setShowNovaReceitaModal] = useState(false);
  const [showNovaDespesaModal, setShowNovaDespesaModal] = useState(false);
  const [showNovaContaPagarModal, setShowNovaContaPagarModal] = useState(false);
  const [showNovaContaReceberModal, setShowNovaContaReceberModal] = useState(false);
  const [data, setData] = useState<DashboardData>({
    totalReceitas: 0,
    totalDespesas: 0,
    saldo: 0,
    receitasRecebidas: 0,
    receitasPendentes: 0,
    despesasPagas: 0,
    despesasPendentes: 0,
    contasPagar: 0,
    contasReceber: 0,
  });
  const [resumo, setResumo] = useState<ResumoData>({
    receitasMes: 0,
    receitasMesAnterior: 0,
    despesasMes: 0,
    despesasMesAnterior: 0,
    lucroMes: 0,
    faturamentoAnual: 0,
    contasPagarProximas: [],
    contasReceberProximas: [],
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Controle de limite anual MEI
  const LIMITE_ANUAL_MEI = 81000; // R$ 81.000 em 2024
  const [faturamentoAnual, setFaturamentoAnual] = useState(0);

  useEffect(() => {
    if (user) {
      loadDashboardData();
      loadChartData();
      loadCategoryData();
      loadFaturamentoAnual();
      loadResumoData();
    }
  }, [user, currentMonth]);

  const loadResumoData = async () => {
    if (!user) return;

    try {
      const hoje = new Date();
      const mesAtual = startOfMonth(hoje);
      const fimMesAtual = endOfMonth(hoje);
      const mesAnterior = startOfMonth(subMonths(hoje, 1));
      const fimMesAnterior = endOfMonth(subMonths(hoje, 1));

      // Receitas mês atual
      const { data: receitasMesAtual } = await supabase
        .from('receitas')
        .select('valor')
        .eq('user_id', user.id)
        .gte('data', format(mesAtual, 'yyyy-MM-dd'))
        .lte('data', format(fimMesAtual, 'yyyy-MM-dd'));

      // Receitas mês anterior
      const { data: receitasMesAnterior } = await supabase
        .from('receitas')
        .select('valor')
        .eq('user_id', user.id)
        .gte('data', format(mesAnterior, 'yyyy-MM-dd'))
        .lte('data', format(fimMesAnterior, 'yyyy-MM-dd'));

      // Despesas mês atual
      const { data: despesasMesAtual } = await supabase
        .from('despesas')
        .select('valor')
        .eq('user_id', user.id)
        .gte('data', format(mesAtual, 'yyyy-MM-dd'))
        .lte('data', format(fimMesAtual, 'yyyy-MM-dd'));

      // Despesas mês anterior
      const { data: despesasMesAnterior } = await supabase
        .from('despesas')
        .select('valor')
        .eq('user_id', user.id)
        .gte('data', format(mesAnterior, 'yyyy-MM-dd'))
        .lte('data', format(fimMesAnterior, 'yyyy-MM-dd'));

      // Faturamento anual
      const anoAtual = new Date().getFullYear();
      const inicioAno = new Date(anoAtual, 0, 1);
      const fimAno = new Date(anoAtual, 11, 31);

      const { data: receitasAno } = await supabase
        .from('receitas')
        .select('valor')
        .eq('user_id', user.id)
        .gte('data', format(inicioAno, 'yyyy-MM-dd'))
        .lte('data', format(fimAno, 'yyyy-MM-dd'));

      // Contas próximas do vencimento (próximos 30 dias)
      const proximosDias = addMonths(hoje, 1);

      const { data: contasPagar } = await supabase
        .from('contas_pagar')
        .select('*')
        .eq('user_id', user.id)
        .eq('pago', false)
        .gte('vencimento', format(hoje, 'yyyy-MM-dd'))
        .lte('vencimento', format(proximosDias, 'yyyy-MM-dd'))
        .order('vencimento', { ascending: true });

      const { data: contasReceber } = await supabase
        .from('contas_receber')
        .select('*')
        .eq('user_id', user.id)
        .eq('recebido', false)
        .gte('vencimento', format(hoje, 'yyyy-MM-dd'))
        .lte('vencimento', format(proximosDias, 'yyyy-MM-dd'))
        .order('vencimento', { ascending: true });

      const receitasMes = receitasMesAtual?.reduce((acc, item) => acc + item.valor, 0) || 0;
      const receitasMesAnt = receitasMesAnterior?.reduce((acc, item) => acc + item.valor, 0) || 0;
      const despesasMes = despesasMesAtual?.reduce((acc, item) => acc + item.valor, 0) || 0;
      const despesasMesAnt = despesasMesAnterior?.reduce((acc, item) => acc + item.valor, 0) || 0;
      const faturamentoAno = receitasAno?.reduce((acc, item) => acc + item.valor, 0) || 0;

      setResumo({
        receitasMes,
        receitasMesAnterior: receitasMesAnt,
        despesasMes,
        despesasMesAnterior: despesasMesAnt,
        lucroMes: receitasMes - despesasMes,
        faturamentoAnual: faturamentoAno,
        contasPagarProximas: contasPagar || [],
        contasReceberProximas: contasReceber || [],
      });
    } catch (error) {
      console.error('Erro ao carregar resumo:', error);
    }
  };

  const loadDashboardData = async () => {
    if (!user) return;

    const startDate = startOfMonth(currentMonth);
    const endDate = endOfMonth(currentMonth);

    try {
      // Receitas do mês
      const { data: receitas } = await supabase
        .from('receitas')
        .select('*')
        .eq('user_id', user.id)
        .gte('data', format(startDate, 'yyyy-MM-dd'))
        .lte('data', format(endDate, 'yyyy-MM-dd'));

      // Despesas do mês
      const { data: despesas } = await supabase
        .from('despesas')
        .select('*')
        .eq('user_id', user.id)
        .gte('data', format(startDate, 'yyyy-MM-dd'))
        .lte('data', format(endDate, 'yyyy-MM-dd'));

      // Contas a pagar
      const { data: contasPagar } = await supabase
        .from('contas_pagar')
        .select('*')
        .eq('user_id', user.id)
        .eq('pago', false);

      // Contas a receber
      const { data: contasReceber } = await supabase
        .from('contas_receber')
        .select('*')
        .eq('user_id', user.id)
        .eq('recebido', false);

      const totalReceitas = receitas?.reduce((acc, item) => acc + item.valor, 0) || 0;
      const totalDespesas = despesas?.reduce((acc, item) => acc + item.valor, 0) || 0;
      const receitasRecebidas = receitas?.filter(r => r.recebido).reduce((acc, item) => acc + item.valor, 0) || 0;
      const receitasPendentes = receitas?.filter(r => !r.recebido).reduce((acc, item) => acc + item.valor, 0) || 0;
      const despesasPagas = despesas?.filter(d => d.pago).reduce((acc, item) => acc + item.valor, 0) || 0;
      const despesasPendentes = despesas?.filter(d => !d.pago).reduce((acc, item) => acc + item.valor, 0) || 0;

      setData({
        totalReceitas,
        totalDespesas,
        saldo: totalReceitas - totalDespesas,
        receitasRecebidas,
        receitasPendentes,
        despesasPagas,
        despesasPendentes,
        contasPagar: contasPagar?.reduce((acc, item) => acc + item.valor, 0) || 0,
        contasReceber: contasReceber?.reduce((acc, item) => acc + item.valor, 0) || 0,
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    if (!user) return;

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(currentMonth, i);
      const startDate = startOfMonth(date);
      const endDate = endOfMonth(date);

      const { data: receitas } = await supabase
        .from('receitas')
        .select('valor')
        .eq('user_id', user.id)
        .gte('data', format(startDate, 'yyyy-MM-dd'))
        .lte('data', format(endDate, 'yyyy-MM-dd'));

      const { data: despesas } = await supabase
        .from('despesas')
        .select('valor')
        .eq('user_id', user.id)
        .gte('data', format(startDate, 'yyyy-MM-dd'))
        .lte('data', format(endDate, 'yyyy-MM-dd'));

      const totalReceitas = receitas?.reduce((acc, item) => acc + item.valor, 0) || 0;
      const totalDespesas = despesas?.reduce((acc, item) => acc + item.valor, 0) || 0;

      months.push({
        mes: format(date, 'MMM', { locale: ptBR }),
        receitas: totalReceitas,
        despesas: totalDespesas,
        saldo: totalReceitas - totalDespesas,
      });
    }

    setChartData(months);
  };

  const loadCategoryData = async () => {
    if (!user) return;

    const startDate = startOfMonth(currentMonth);
    const endDate = endOfMonth(currentMonth);

    const { data: receitas } = await supabase
      .from('receitas')
      .select('categoria, valor')
      .eq('user_id', user.id)
      .gte('data', format(startDate, 'yyyy-MM-dd'))
      .lte('data', format(endDate, 'yyyy-MM-dd'));

    const categories: { [key: string]: number } = {};
    receitas?.forEach(receita => {
      categories[receita.categoria] = (categories[receita.categoria] || 0) + receita.valor;
    });

    const categoryArray = Object.entries(categories).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length],
    }));

    setCategoryData(categoryArray);
  };

  const loadFaturamentoAnual = async () => {
    if (!user) return;

    const currentYear = new Date().getFullYear();
    const startYear = new Date(currentYear, 0, 1);
    const endYear = new Date(currentYear, 11, 31);

    const { data: receitas } = await supabase
      .from('receitas')
      .select('valor')
      .eq('user_id', user.id)
      .gte('data', format(startYear, 'yyyy-MM-dd'))
      .lte('data', format(endYear, 'yyyy-MM-dd'));

    const total = receitas?.reduce((acc, item) => acc + item.valor, 0) || 0;
    setFaturamentoAnual(total);
  };

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleModalSuccess = () => {
    loadDashboardData();
    loadResumoData();
    loadChartData();
    loadCategoryData();
    loadFaturamentoAnual();
  };

  const percentualLimite = (faturamentoAnual / LIMITE_ANUAL_MEI) * 100;
  const isProximoLimite = percentualLimite > 80;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Visão geral das suas finanças</p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
            <button
              onClick={() => setShowNovaReceitaModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors cursor-pointer whitespace-nowrap flex items-center"
            >
              <i className="ri-add-line mr-2"></i>
              Nova Receita
            </button>
            <button
              onClick={() => setShowNovaDespesaModal(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors cursor-pointer whitespace-nowrap flex items-center"
            >
              <i className="ri-add-line mr-2"></i>
              Nova Despesa
            </button>
            <button
              onClick={() => setShowNovaContaPagarModal(true)}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors cursor-pointer whitespace-nowrap flex items-center"
            >
              <i className="ri-add-line mr-2"></i>
              Conta a Pagar
            </button>
            <button
              onClick={() => setShowNovaContaReceberModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap flex items-center"
            >
              <i className="ri-add-line mr-2"></i>
              Conta a Receber
            </button>
          </div>
        </div>

        {/* Banner de Boas-vindas */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                Olá, {user?.nome?.split(' ')[0]}! 👋
              </h1>
              <p className="text-blue-100">
                Bem-vindo ao seu painel financeiro. Aqui você tem controle total do seu MEI.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowNovaReceitaModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap cursor-pointer flex items-center space-x-2"
              >
                <i className="ri-add-line"></i>
                <span>Nova Receita</span>
              </button>
              <div className="text-right">
                <div className="text-sm text-blue-200">Status da Conta</div>
                <div className={`font-semibold ${
                  user?.status_assinatura === 'trial' ? 'text-yellow-200' :
                  user?.status_assinatura === 'ativo' ? 'text-green-200' : 'text-red-200'
                }`}>
                  {user?.status_assinatura === 'trial' ? '🔄 Trial' :
                   user?.status_assinatura === 'ativo' ? '✅ Ativo' : '❌ Expirado'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alertas MEI */}
        <MEIAlerts />

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Receitas do Mês */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receitas do Mês</p>
                <p className="text-2xl font-bold text-green-600">
                  {loading ? '...' : formatCurrency(resumo.receitasMes)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <i className="ri-arrow-up-line text-2xl text-green-600"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">
                {resumo.receitasMes > resumo.receitasMesAnterior ? '📈' : '📉'} 
                {resumo.receitasMes > 0 ? 
                  ` ${((resumo.receitasMes - resumo.receitasMesAnterior) / Math.max(resumo.receitasMesAnterior, 1) * 100).toFixed(1)}%` : 
                  ' 0%'}
                vs mês anterior
              </span>
            </div>
          </div>

          {/* Despesas do Mês */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Despesas do Mês</p>
                <p className="text-2xl font-bold text-red-600">
                  {loading ? '...' : formatCurrency(resumo.despesasMes)}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <i className="ri-arrow-down-line text-2xl text-red-600"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">
                {resumo.despesasMes > resumo.despesasMesAnterior ? '📈' : '📉'} 
                {resumo.despesasMes > 0 ? 
                  ` ${((resumo.despesasMes - resumo.despesasMesAnterior) / Math.max(resumo.despesasMesAnterior, 1) * 100).toFixed(1)}%` : 
                  ' 0%'}
                vs mês anterior
              </span>
            </div>
          </div>

          {/* Lucro do Mês */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lucro do Mês</p>
                <p className={`text-2xl font-bold ${resumo.lucroMes >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {loading ? '...' : formatCurrency(resumo.lucroMes)}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                resumo.lucroMes >= 0 ? 'bg-blue-100' : 'bg-orange-100'
              }`}>
                <i className={`ri-line-chart-line text-2xl ${
                  resumo.lucroMes >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`}></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">
                {resumo.lucroMes >= 0 ? '💰 Lucro' : '⚠️ Prejuízo'} este mês
              </span>
            </div>
          </div>

          {/* Faturamento Anual */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Faturamento Anual</p>
                <p className="text-2xl font-bold text-purple-600">
                  {loading ? '...' : formatCurrency(resumo.faturamentoAnual)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <i className="ri-bar-chart-line text-2xl text-purple-600"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">
                📊 {((resumo.faturamentoAnual / 81000) * 100).toFixed(1)}% do limite MEI
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          {/* Gráfico Financeiro */}
          <div className="xl:col-span-2">
            <FinancialChart />
          </div>

          {/* Ações Rápidas */}
          <div>
            <QuickActions 
              onNovaReceita={() => setShowNovaReceitaModal(true)}
              onNovaDespesa={() => setShowNovaDespesaModal(true)}
              onNovaContaPagar={() => setShowNovaContaPagarModal(true)}
              onNovaContaReceber={() => setShowNovaContaReceberModal(true)}
            />
          </div>
        </div>

        {/* Contas Próximas do Vencimento */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Contas a Pagar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i className="ri-money-dollar-circle-line mr-2 text-red-600"></i>
              Contas a Pagar (Próximas)
            </h3>
            
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : resumo.contasPagarProximas.length === 0 ? (
              <div className="text-center py-8">
                <i className="ri-checkbox-circle-line text-4xl text-green-500 mb-3"></i>
                <p className="text-gray-500">Nenhuma conta próxima do vencimento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {resumo.contasPagarProximas.slice(0, 5).map((conta) => (
                  <div key={conta.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{conta.descricao}</p>
                      <p className="text-sm text-gray-600">
                        Vence em {format(new Date(conta.vencimento), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">
                        {formatCurrency(conta.valor)}
                      </p>
                    </div>
                  </div>
                ))}
                {resumo.contasPagarProximas.length > 5 && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => navigate('/contas-pagar')}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer whitespace-nowrap"
                    >
                      Ver todas ({resumo.contasPagarProximas.length}) →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Contas a Receber */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i className="ri-money-dollar-circle-line mr-2 text-green-600"></i>
              Contas a Receber (Próximas)
            </h3>
            
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : resumo.contasReceberProximas.length === 0 ? (
              <div className="text-center py-8">
                <i className="ri-information-line text-4xl text-blue-500 mb-3"></i>
                <p className="text-gray-500">Nenhuma conta próxima do vencimento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {resumo.contasReceberProximas.slice(0, 5).map((conta) => (
                  <div key={conta.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{conta.descricao}</p>
                      <p className="text-sm text-gray-600">
                        Vence em {format(new Date(conta.vencimento), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {formatCurrency(conta.valor)}
                      </p>
                    </div>
                  </div>
                ))}
                {resumo.contasReceberProximas.length > 5 && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => navigate('/contas-receber')}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer whitespace-nowrap"
                    >
                      Ver todas ({resumo.contasReceberProximas.length}) →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé com Dicas */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="ri-lightbulb-line text-2xl text-blue-600"></i>
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">💡 Dica do Dia</h4>
              <p className="text-blue-800 leading-relaxed">
                Mantenha sempre suas receitas e despesas atualizadas para ter uma visão real da saúde 
                financeira do seu MEI. Use a calculadora DAS para planejar seus impostos e nunca perca 
                prazos importantes!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <NovaReceitaModal
        isOpen={showNovaReceitaModal}
        onClose={() => setShowNovaReceitaModal(false)}
        onSuccess={handleModalSuccess}
      />

      <NovaDespesaModal
        isOpen={showNovaDespesaModal}
        onClose={() => setShowNovaDespesaModal(false)}
        onSuccess={handleModalSuccess}
      />

      <NovaContaPagarModal
        isOpen={showNovaContaPagarModal}
        onClose={() => setShowNovaContaPagarModal(false)}
        onSuccess={handleModalSuccess}
      />

      <NovaContaReceberModal
        isOpen={showNovaContaReceberModal}
        onClose={() => setShowNovaContaReceberModal(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}

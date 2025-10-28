
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Receita, Despesa } from '../../lib/supabase';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import TrialBanner from '../../components/layout/TrialBanner';

export default function Relatorios() {
  const { user } = useAuth();
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState({
    inicio: startOfMonth(new Date()).toISOString().split('T')[0],
    fim: endOfMonth(new Date()).toISOString().split('T')[0],
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const [receitasRes, despesasRes] = await Promise.all([
      supabase.from('receitas').select('*').eq('user_id', user.id),
      supabase.from('despesas').select('*').eq('user_id', user.id),
    ]);

    setReceitas(receitasRes.data || []);
    setDespesas(despesasRes.data || []);
    setLoading(false);
  };

  const receitasFiltradas = receitas.filter(r => {
    const data = new Date(r.data);
    const inicio = new Date(periodo.inicio);
    const fim = new Date(periodo.fim);
    return isWithinInterval(data, { start: inicio, end: fim });
  });

  const despesasFiltradas = despesas.filter(d => {
    const data = new Date(d.data);
    const inicio = new Date(periodo.inicio);
    const fim = new Date(periodo.fim);
    return isWithinInterval(data, { start: inicio, end: fim });
  });

  const totalReceitas = receitasFiltradas.reduce((sum, r) => sum + Number(r.valor), 0);
  const totalDespesas = despesasFiltradas.reduce((sum, d) => sum + Number(d.valor), 0);
  const saldo = totalReceitas - totalDespesas;
  const lucro = totalReceitas > 0 ? (saldo / totalReceitas) * 100 : 0;
  const dasAPagar = totalReceitas * 0.06;

  const chartData = Array.from({ length: 6 }, (_, i) => {
    const mes = subMonths(new Date(), 5 - i);
    const inicio = startOfMonth(mes);
    const fim = endOfMonth(mes);

    const receitasMes = receitas.filter(r => {
      const data = new Date(r.data);
      return isWithinInterval(data, { start: inicio, end: fim });
    }).reduce((sum, r) => sum + Number(r.valor), 0);

    const despesasMes = despesas.filter(d => {
      const data = new Date(d.data);
      return isWithinInterval(data, { start: inicio, end: fim });
    }).reduce((sum, d) => sum + Number(d.valor), 0);

    return {
      mes: format(mes, 'MMM/yy', { locale: ptBR }),
      receitas: receitasMes,
      despesas: despesasMes,
      saldo: receitasMes - despesasMes,
    };
  });

  const categoriasReceitas = ['Venda Produtos', 'Prestação Serviços', 'Outras'];
  const pieReceitasData = categoriasReceitas.map(cat => ({
    name: cat,
    value: receitasFiltradas.filter(r => r.categoria === cat).reduce((sum, r) => sum + Number(r.valor), 0),
  })).filter(d => d.value > 0);

  const categoriasDespesas = ['Fornecedores', 'Aluguel', 'Água/Luz', 'Internet', 'Produtos', 'Combustível', 'Marketing', 'Outras'];
  const pieDespesasData = categoriasDespesas.map(cat => ({
    name: cat,
    value: despesasFiltradas.filter(d => d.categoria === cat).reduce((sum, d) => sum + Number(d.valor), 0),
  })).filter(d => d.value > 0);

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

  const topReceitas = [...receitasFiltradas]
    .sort((a, b) => Number(b.valor) - Number(a.valor))
    .slice(0, 10);

  const topDespesas = [...despesasFiltradas]
    .sort((a, b) => Number(b.valor) - Number(a.valor))
    .slice(0, 10);

  const exportarPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('Relatório Financeiro - FinanceMEI', 14, 20);

    doc.setFontSize(12);
    doc.text(`Período: ${format(new Date(periodo.inicio), 'dd/MM/yyyy')} a ${format(new Date(periodo.fim), 'dd/MM/yyyy')}`, 14, 30);

    doc.setFontSize(14);
    doc.text('Resumo Geral', 14, 45);

    autoTable(doc, {
      startY: 50,
      head: [['Indicador', 'Valor']],
      body: [
        ['Total de Receitas', `R$ ${totalReceitas.toFixed(2)}`],
        ['Total de Despesas', `R$ ${totalDespesas.toFixed(2)}`],
        ['Saldo', `R$ ${saldo.toFixed(2)}`],
        ['Margem de Lucro', `${lucro.toFixed(2)}%`],
        ['DAS a Pagar (6%)', `R$ ${dasAPagar.toFixed(2)}`],
      ],
    });

    doc.addPage();
    doc.setFontSize(14);
    doc.text('Top 10 Receitas', 14, 20);

    autoTable(doc, {
      startY: 25,
      head: [['Data', 'Descrição', 'Categoria', 'Valor']],
      body: topReceitas.map(r => [
        format(new Date(r.data), 'dd/MM/yyyy'),
        r.descricao,
        r.categoria,
        `R$ ${Number(r.valor).toFixed(2)}`,
      ]),
    });

    const finalY = (doc as any).lastAutoTable.finalY || 25;
    doc.setFontSize(14);
    doc.text('Top 10 Despesas', 14, finalY + 15);

    autoTable(doc, {
      startY: finalY + 20,
      head: [['Data', 'Descrição', 'Categoria', 'Valor']],
      body: topDespesas.map(d => [
        format(new Date(d.data), 'dd/MM/yyyy'),
        d.descricao,
        d.categoria,
        `R$ ${Number(d.valor).toFixed(2)}`,
      ]),
    });

    doc.save(`relatorio-${format(new Date(), 'dd-MM-yyyy')}.pdf`);
  };

  const proximoDia20 = () => {
    const hoje = new Date();
    const mes = hoje.getMonth() === 11 ? 0 : hoje.getMonth() + 1;
    const ano = hoje.getMonth() === 11 ? hoje.getFullYear() + 1 : hoje.getFullYear();
    return new Date(ano, mes, 20);
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="flex items-center justify-center h-screen">
          <i className="ri-loader-4-line text-4xl text-blue-600 animate-spin"></i>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 bg-gray-50 min-h-screen">
      <TrialBanner />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 lg:mb-8 gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Relatórios</h1>
        <button
          onClick={exportarPDF}
          className="px-4 lg:px-6 py-2 lg:py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 text-sm lg:text-base"
        >
          <i className="ri-download-line text-lg lg:text-xl"></i>
          Exportar PDF
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 border border-gray-100 mb-4 lg:mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Selecionar Período</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
            <input
              type="date"
              value={periodo.inicio}
              onChange={(e) => setPeriodo({ ...periodo, inicio: e.target.value })}
              className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
            <input
              type="date"
              value={periodo.fim}
              onChange={(e) => setPeriodo({ ...periodo, fim: e.target.value })}
              className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-sm p-6 lg:p-8 border border-blue-500 mb-4 lg:mb-6 text-white">
        <h3 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">Resumo Geral</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div>
            <p className="text-blue-100 text-xs lg:text-sm mb-1">Total de Receitas</p>
            <p className="text-xl lg:text-3xl font-bold">R$ {totalReceitas.toFixed(2).replace('.', ',')}</p>
          </div>
          <div>
            <p className="text-blue-100 text-xs lg:text-sm mb-1">Total de Despesas</p>
            <p className="text-xl lg:text-3xl font-bold">R$ {totalDespesas.toFixed(2).replace('.', ',')}</p>
          </div>
          <div>
            <p className="text-blue-100 text-xs lg:text-sm mb-1">Saldo</p>
            <p className={`text-xl lg:text-3xl font-bold ${saldo >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              R$ {saldo.toFixed(2).replace('.', ',')}
            </p>
          </div>
          <div>
            <p className="text-blue-100 text-xs lg:text-sm mb-1">Margem de Lucro</p>
            <p className="text-xl lg:text-3xl font-bold">{lucro.toFixed(2)}%</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 border border-gray-100 mb-4 lg:mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Evolução Mensal</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
            <Legend />
            <Line type="monotone" dataKey="receitas" stroke="#10B981" strokeWidth={2} name="Receitas" />
            <Line type="monotone" dataKey="despesas" stroke="#EF4444" strokeWidth={2} name="Despesas" />
            <Line type="monotone" dataKey="saldo" stroke="#2563EB" strokeWidth={2} name="Saldo" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-4 lg:mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Receitas por Categoria</h3>
          {pieReceitasData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieReceitasData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: R$ ${entry.value.toFixed(2)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieReceitasData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-400">
              Nenhuma receita no período
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Despesas por Categoria</h3>
          {pieDespesasData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieDespesasData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: R$ ${entry.value.toFixed(2)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieDespesasData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-400">
              Nenhuma despesa no período
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-4 lg:mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Receitas</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {topReceitas.length > 0 ? (
              topReceitas.map((r, index) => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 lg:w-8 lg:h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-xs lg:text-sm">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm lg:text-base truncate">{r.descricao}</p>
                      <p className="text-xs text-gray-500">{format(new Date(r.data), 'dd/MM/yyyy')}</p>
                    </div>
                  </div>
                  <p className="font-semibold text-green-600 text-sm lg:text-base">
                    R$ {Number(r.valor).toFixed(2).replace('.', ',')}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">Nenhuma receita no período</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Despesas</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {topDespesas.length > 0 ? (
              topDespesas.map((d, index) => (
                <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 lg:w-8 lg:h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-semibold text-xs lg:text-sm">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm lg:text-base truncate">{d.descricao}</p>
                      <p className="text-xs text-gray-500">{format(new Date(d.data), 'dd/MM/yyyy')}</p>
                    </div>
                  </div>
                  <p className="font-semibold text-red-600 text-sm lg:text-base">
                    R$ {Number(d.valor).toFixed(2).replace('.', ',')}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">Nenhuma despesa no período</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-orange-50 border-l-4 border-orange-400 rounded-xl shadow-sm p-4 lg:p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <i className="ri-file-text-line text-xl lg:text-2xl text-orange-600"></i>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cálculo do DAS (MEI)</h3>
            <p className="text-gray-700 mb-3 text-sm lg:text-base">
              Com base na receita total do período, o valor do DAS (6% da receita) é:
            </p>
            <p className="text-2xl lg:text-3xl font-bold text-orange-600 mb-3">
              R$ {dasAPagar.toFixed(2).replace('.', ',')}
            </p>
            <p className="text-xs lg:text-sm text-gray-600">
              <i className="ri-calendar-line mr-1"></i>
              Prazo de pagamento: até dia 20 de {format(proximoDia20(), 'MMMM/yyyy', { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

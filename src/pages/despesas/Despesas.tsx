
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Despesa } from '../../lib/supabase';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import TrialBanner from '../../components/layout/TrialBanner';

export default function Despesas() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    dataInicio: startOfMonth(new Date()).toISOString().split('T')[0],
    dataFim: endOfMonth(new Date()).toISOString().split('T')[0],
    categoria: 'todas',
    status: 'todas',
  });

  useEffect(() => {
    if (user) {
      loadDespesas();
    }
  }, [user]);

  const loadDespesas = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('despesas')
      .select('*')
      .eq('user_id', user.id)
      .order('data', { ascending: false });

    if (!error && data) {
      setDespesas(data);
    }
    setLoading(false);
  };

  const despesasFiltradas = despesas.filter(d => {
    const data = new Date(d.data);
    const inicio = new Date(filtros.dataInicio);
    const fim = new Date(filtros.dataFim);

    const dentroData = isWithinInterval(data, { start: inicio, end: fim });
    const categoriaMatch = filtros.categoria === 'todas' || d.categoria === filtros.categoria;
    const statusMatch = filtros.status === 'todas' || 
                       (filtros.status === 'pago' && d.pago) ||
                       (filtros.status === 'pendente' && !d.pago);

    return dentroData && categoriaMatch && statusMatch;
  });

  const totalDespesas = despesasFiltradas.reduce((sum, d) => sum + Number(d.valor), 0);
  const totalPago = despesasFiltradas.filter(d => d.pago).reduce((sum, d) => sum + Number(d.valor), 0);
  const totalAPagar = totalDespesas - totalPago;

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;

    const { error } = await supabase.from('despesas').delete().eq('id', id);
    if (!error) {
      loadDespesas();
    }
  };

  const handleTogglePago = async (despesa: Despesa) => {
    const { error } = await supabase
      .from('despesas')
      .update({
        pago: !despesa.pago,
        data_pagamento: !despesa.pago ? new Date().toISOString().split('T')[0] : null,
      })
      .eq('id', despesa.id);

    if (!error) {
      loadDespesas();
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-screen">
          <i className="ri-loader-4-line text-4xl text-blue-600 animate-spin"></i>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <TrialBanner />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl lg:text-3xl font-bold text-gray-900">Despesas</h1>
        <button
          onClick={() => navigate('/nova-despesa')}
          className="px-4 lg:px-6 py-2 lg:py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
        >
          <i className="ri-add-line text-lg lg:text-xl"></i>
          <span className="hidden sm:inline">Nova Despesa</span>
          <span className="sm:hidden">Nova</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 border border-gray-100">
          <h3 className="text-xs lg:text-sm font-medium text-gray-600 mb-2">Total de Despesas</h3>
          <p className="text-lg lg:text-2xl font-bold text-red-600">
            R$ {totalDespesas.toFixed(2).replace('.', ',')}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 border border-gray-100">
          <h3 className="text-xs lg:text-sm font-medium text-gray-600 mb-2">Total Pago</h3>
          <p className="text-lg lg:text-2xl font-bold text-blue-600">
            R$ {totalPago.toFixed(2).replace('.', ',')}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 border border-gray-100">
          <h3 className="text-xs lg:text-sm font-medium text-gray-600 mb-2">A Pagar</h3>
          <p className="text-lg lg:text-2xl font-bold text-orange-600">
            R$ {totalAPagar.toFixed(2).replace('.', ',')}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 border border-gray-100">
        <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">Data Início</label>
            <input
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
              className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs lg:text-sm"
            />
          </div>
          <div>
            <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">Data Fim</label>
            <input
              type="date"
              value={filtros.dataFim}
              onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
              className="w-full px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs lg:text-sm"
            />
          </div>
          <div>
            <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">Categoria</label>
            <select
              value={filtros.categoria}
              onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
              className="w-full px-3 lg:px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-xs lg:text-sm"
            >
              <option value="todas">Todas</option>
              <option value="Fornecedores">Fornecedores</option>
              <option value="Aluguel">Aluguel</option>
              <option value="Água/Luz">Água/Luz</option>
              <option value="Internet">Internet</option>
              <option value="Produtos">Produtos</option>
              <option value="Combustível">Combustível</option>
              <option value="Marketing">Marketing</option>
              <option value="Outras">Outras</option>
            </select>
          </div>
          <div>
            <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filtros.status}
              onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
              className="w-full px-3 lg:px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-xs lg:text-sm"
            >
              <option value="todas">Todas</option>
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase">Data</th>
                <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase min-w-32">Descrição</th>
                <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase">Categoria</th>
                <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase">Valor</th>
                <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {despesasFiltradas.length > 0 ? (
                despesasFiltradas.map((despesa) => (
                  <tr key={despesa.id} className="hover:bg-gray-50">
                    <td className="px-3 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-gray-900 whitespace-nowrap">
                      {format(new Date(despesa.data), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-3 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-gray-900">
                      <div className="max-w-32 lg:max-w-none truncate">{despesa.descricao}</div>
                    </td>
                    <td className="px-3 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-gray-600 whitespace-nowrap">{despesa.categoria}</td>
                    <td className="px-3 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm font-semibold text-red-600 whitespace-nowrap">
                      R$ {Number(despesa.valor).toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-3 lg:px-6 py-3 lg:py-4">
                      <span className={`px-2 lg:px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                        despesa.pago
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {despesa.pago ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-3 lg:px-6 py-3 lg:py-4">
                      <div className="flex items-center gap-1 lg:gap-2">
                        <button
                          onClick={() => handleTogglePago(despesa)}
                          className="p-1.5 lg:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title={despesa.pago ? 'Marcar como pendente' : 'Marcar como pagamento'}
                        >
                          <i className={`${despesa.pago ? 'ri-close-circle-line' : 'ri-check-line'} text-sm lg:text-lg w-4 h-4 lg:w-5 lg:h-5 flex items-center justify-center`}></i>
                        </button>
                        <button
                          onClick={() => handleDelete(despesa.id)}
                          className="p-1.5 lg:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <i className="ri-delete-bin-line text-sm lg:text-lg w-4 h-4 lg:w-5 lg:h-5 flex items-center justify-center"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <div className="text-xs lg:text-sm">Nenhuma despesa encontrada</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

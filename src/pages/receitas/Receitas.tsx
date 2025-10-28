
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Receita } from '../../lib/supabase';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import TrialBanner from '../../components/layout/TrialBanner';

export default function Receitas() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    dataInicio: startOfMonth(new Date()).toISOString().split('T')[0],
    dataFim: endOfMonth(new Date()).toISOString().split('T')[0],
    categoria: 'todas',
    status: 'todas',
  });

  useEffect(() => {
    if (user) {
      loadReceitas();
    }
  }, [user]);

  const loadReceitas = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('receitas')
      .select('*')
      .eq('user_id', user.id)
      .order('data', { ascending: false });

    if (!error && data) {
      setReceitas(data);
    }
    setLoading(false);
  };

  const receitasFiltradas = receitas.filter(r => {
    const data = new Date(r.data);
    const inicio = new Date(filtros.dataInicio);
    const fim = new Date(filtros.dataFim);

    const dentroData = isWithinInterval(data, { start: inicio, end: fim });
    const categoriaMatch = filtros.categoria === 'todas' || r.categoria === filtros.categoria;
    const statusMatch = filtros.status === 'todas' || 
                       (filtros.status === 'recebido' && r.recebido) ||
                       (filtros.status === 'pendente' && !r.recebido);

    return dentroData && categoriaMatch && statusMatch;
  });

  const totalReceitas = receitasFiltradas.reduce((sum, r) => sum + Number(r.valor), 0);
  const totalRecebido = receitasFiltradas.filter(r => r.recebido).reduce((sum, r) => sum + Number(r.valor), 0);
  const totalAReceber = totalReceitas - totalRecebido;

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta receita?')) return;

    const { error } = await supabase.from('receitas').delete().eq('id', id);
    if (!error) {
      loadReceitas();
    }
  };

  const handleToggleRecebido = async (receita: Receita) => {
    const { error } = await supabase
      .from('receitas')
      .update({
        recebido: !receita.recebido,
        data_recebimento: !receita.recebido ? new Date().toISOString().split('T')[0] : null,
      })
      .eq('id', receita.id);

    if (!error) {
      loadReceitas();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <i className="ri-loader-4-line text-4xl text-blue-600 animate-spin"></i>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <TrialBanner />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl lg:text-3xl font-bold text-gray-900">Receitas</h1>
        <button
          onClick={() => navigate('/nova-receita')}
          className="px-4 lg:px-6 py-2 lg:py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
        >
          <i className="ri-add-line text-lg lg:text-xl"></i>
          <span className="hidden sm:inline">Nova Receita</span>
          <span className="sm:hidden">Nova</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 border border-gray-100">
          <h3 className="text-xs lg:text-sm font-medium text-gray-600 mb-2">Total de Receitas</h3>
          <p className="text-lg lg:text-2xl font-bold text-green-600">
            R$ {totalReceitas.toFixed(2).replace('.', ',')}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 border border-gray-100">
          <h3 className="text-xs lg:text-sm font-medium text-gray-600 mb-2">Total Recebido</h3>
          <p className="text-lg lg:text-2xl font-bold text-blue-600">
            R$ {totalRecebido.toFixed(2).replace('.', ',')}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 border border-gray-100">
          <h3 className="text-xs lg:text-sm font-medium text-gray-600 mb-2">A Receber</h3>
          <p className="text-lg lg:text-2xl font-bold text-orange-600">
            R$ {totalAReceber.toFixed(2).replace('.', ',')}
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
              <option value="Venda Produtos">Venda Produtos</option>
              <option value="Prestação Serviços">Prestação Serviços</option>
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
              <option value="recebido">Recebido</option>
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
              {receitasFiltradas.length > 0 ? (
                receitasFiltradas.map((receita) => (
                  <tr key={receita.id} className="hover:bg-gray-50">
                    <td className="px-3 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-gray-900 whitespace-nowrap">
                      {format(new Date(receita.data), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-3 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-gray-900">
                      <div className="max-w-32 lg:max-w-none truncate">{receita.descricao}</div>
                    </td>
                    <td className="px-3 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-gray-600 whitespace-nowrap">{receita.categoria}</td>
                    <td className="px-3 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm font-semibold text-green-600 whitespace-nowrap">
                      R$ {Number(receita.valor).toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-3 lg:px-6 py-3 lg:py-4">
                      <span className={`px-2 lg:px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                        receita.recebido
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {receita.recebido ? 'Recebido' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-3 lg:px-6 py-3 lg:py-4">
                      <div className="flex items-center gap-1 lg:gap-2">
                        <button
                          onClick={() => handleToggleRecebido(receita)}
                          className="p-1.5 lg:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title={receita.recebido ? 'Marcar como pendente' : 'Marcar como recebido'}
                        >
                          <i className={`${receita.recebido ? 'ri-close-circle-line' : 'ri-check-line'} text-sm lg:text-lg w-4 h-4 lg:w-5 lg:h-5 flex items-center justify-center`}></i>
                        </button>
                        <button
                          onClick={() => handleDelete(receita.id)}
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
                    <div className="text-xs lg:text-sm">Nenhuma receita encontrada</div>
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

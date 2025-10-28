
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import TrialBanner from '../../components/layout/TrialBanner';

export default function NovaReceita() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    data: new Date().toISOString().split('T')[0],
    categoria: 'Venda Produtos',
    recebido: false,
    data_recebimento: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase.from('receitas').insert([{
        user_id: user.id,
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        data: formData.data,
        categoria: formData.categoria,
        recebido: formData.recebido,
        data_recebimento: formData.recebido ? formData.data_recebimento : null,
      }]);

      if (error) throw error;

      navigate('/receitas');
    } catch (error) {
      console.error('Erro ao salvar receita:', error);
      alert('Erro ao salvar receita');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <TrialBanner />

      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/receitas')}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <i className="ri-arrow-left-line text-xl"></i>
        </button>
        <h1 className="text-xl lg:text-3xl font-bold text-gray-900">Nova Receita</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 lg:p-8 border border-gray-100 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição *
            </label>
            <input
              type="text"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="Ex: Venda de produto"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="0,00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data *
            </label>
            <input
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria *
            </label>
            <select
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none cursor-pointer"
              required
            >
              <option value="Venda Produtos">Venda Produtos</option>
              <option value="Prestação Serviços">Prestação Serviços</option>
              <option value="Outras">Outras</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="recebido"
              checked={formData.recebido}
              onChange={(e) => setFormData({ ...formData, recebido: e.target.checked })}
              className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
            />
            <label htmlFor="recebido" className="text-sm font-medium text-gray-700 cursor-pointer">
              Já foi recebido?
            </label>
          </div>

          {formData.recebido && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Recebimento *
              </label>
              <input
                type="date"
                value={formData.data_recebimento}
                onChange={(e) => setFormData({ ...formData, data_recebimento: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                required={formData.recebido}
              />
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              {loading ? 'Salvando...' : 'Salvar Receita'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/receitas')}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors cursor-pointer whitespace-nowrap"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

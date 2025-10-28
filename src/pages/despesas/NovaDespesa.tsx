
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import TrialBanner from '../../components/layout/TrialBanner';

export default function NovaDespesa() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    data: new Date().toISOString().split('T')[0],
    categoria: 'Fornecedores',
    pago: false,
    data_pagamento: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase.from('despesas').insert([{
        user_id: user.id,
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        data: formData.data,
        categoria: formData.categoria,
        pago: formData.pago,
        data_pagamento: formData.pago ? formData.data_pagamento : null,
      }]);

      if (error) throw error;

      navigate('/despesas');
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      alert('Erro ao salvar despesa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <TrialBanner />

      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/despesas')}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <i className="ri-arrow-left-line text-xl"></i>
        </button>
        <h1 className="text-xl lg:text-3xl font-bold text-gray-900">Nova Despesa</h1>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              placeholder="Ex: Compra de material"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
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
              className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none cursor-pointer"
              required
            >
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

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="pago"
              checked={formData.pago}
              onChange={(e) => setFormData({ ...formData, pago: e.target.checked })}
              className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
            />
            <label htmlFor="pago" className="text-sm font-medium text-gray-700 cursor-pointer">
              Já foi pago?
            </label>
          </div>

          {formData.pago && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Pagamento *
              </label>
              <input
                type="date"
                value={formData.data_pagamento}
                onChange={(e) => setFormData({ ...formData, data_pagamento: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                required={formData.pago}
              />
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              {loading ? 'Salvando...' : 'Salvar Despesa'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/despesas')}
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

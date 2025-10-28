
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, ContaReceber } from '../../lib/supabase';
import { format, differenceInDays } from 'date-fns';
import TrialBanner from '../../components/layout/TrialBanner';

export default function ContasReceber() {
  const { user } = useAuth();
  const [contas, setContas] = useState<ContaReceber[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todas' | 'vencidas' | 'proximas'>('todas');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    vencimento: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (user) {
      loadContas();
    }
  }, [user]);

  const loadContas = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('contas_receber')
      .select('*')
      .eq('user_id', user.id)
      .order('vencimento', { ascending: true });

    if (!error && data) {
      setContas(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || saving) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('contas_receber').insert([{
        user_id: user.id,
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        vencimento: formData.vencimento,
        recebido: false,
      }]);

      if (error) {
        console.error('Erro ao salvar conta:', error);
        alert('Erro ao salvar conta. Tente novamente.');
        return;
      }

      setShowModal(false);
      setFormData({
        descricao: '',
        valor: '',
        vencimento: new Date().toISOString().split('T')[0],
      });
      await loadContas();
      alert('Conta salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      alert('Erro ao salvar conta. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleMarcarRecebido = async (id: string) => {
    const { error } = await supabase
      .from('contas_receber')
      .update({ recebido: true })
      .eq('id', id);

    if (!error) {
      loadContas();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return;

    const { error } = await supabase.from('contas_receber').delete().eq('id', id);
    if (!error) {
      loadContas();
    }
  };

  const contasFiltradas = contas.filter(c => {
    if (c.recebido) return false;

    const hoje = new Date();
    const vencimento = new Date(c.vencimento);
    const dias = differenceInDays(vencimento, hoje);

    if (filtro === 'vencidas') return dias < 0;
    if (filtro === 'proximas') return dias >= 0 && dias <= 7;
    return true;
  });

  const totalAReceber = contasFiltradas.reduce((sum, c) => sum + Number(c.valor), 0);

  const getDiasBadge = (vencimento: string) => {
    const hoje = new Date();
    const venc = new Date(vencimento);
    const dias = differenceInDays(venc, hoje);

    if (dias < 0) {
      return (
        <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full whitespace-nowrap">
          Vencido há {Math.abs(dias)} dia{Math.abs(dias) !== 1 ? 's' : ''}
        </span>
      );
    }

    if (dias === 0) {
      return (
        <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full whitespace-nowrap">
          Vence hoje
        </span>
      );
    }

    return (
      <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full whitespace-nowrap">
        {dias} dia{dias !== 1 ? 's' : ''}
      </span>
    );
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
    <div className="p-8">
      <TrialBanner />

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Contas a Receber</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2"
        >
          <i className="ri-add-line text-xl"></i>
          Nova Conta
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <button
              onClick={() => setFiltro('todas')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                filtro === 'todas'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFiltro('vencidas')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                filtro === 'vencidas'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Vencidas
            </button>
            <button
              onClick={() => setFiltro('proximas')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                filtro === 'proximas'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Próximas (7 dias)
            </button>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total a Receber</p>
            <p className="text-2xl font-bold text-green-600">
              R$ {totalAReceber.toFixed(2).replace('.', ',')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contasFiltradas.length > 0 ? (
          contasFiltradas.map((conta) => (
            <div key={conta.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{conta.descricao}</h3>
                </div>
                <button
                  onClick={() => handleDelete(conta.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  <i className="ri-delete-bin-line text-lg w-5 h-5 flex items-center justify-center"></i>
                </button>
              </div>

              <div className="mb-4">
                <p className="text-2xl font-bold text-green-600">
                  R$ {Number(conta.valor).toFixed(2).replace('.', ',')}
                </p>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-500">Vencimento</p>
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(conta.vencimento), 'dd/MM/yyyy')}
                  </p>
                </div>
                {getDiasBadge(conta.vencimento)}
              </div>

              <button
                onClick={() => handleMarcarRecebido(conta.id)}
                className="w-full py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                Marcar como Recebido
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <i className="ri-file-list-2-line text-6xl text-gray-300 mb-4"></i>
            <p className="text-gray-400">Nenhuma conta a receber encontrada</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Nova Conta a Receber</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <input
                  type="text"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  required
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  required
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vencimento</label>
                <input
                  type="date"
                  value={formData.vencimento}
                  onChange={(e) => setFormData({ ...formData, vencimento: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  required
                  disabled={saving}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

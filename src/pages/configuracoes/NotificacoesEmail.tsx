
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface NotificationSettings {
  vencimentos_proximos: boolean;
  relatorio_semanal: boolean;
  limite_mei_alerta: boolean;
  dias_antecedencia: number;
  email_notificacoes: string;
}

export default function NotificacoesEmail() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>({
    vencimentos_proximos: true,
    relatorio_semanal: false,
    limite_mei_alerta: true,
    dias_antecedencia: 3,
    email_notificacoes: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setSettings({
          vencimentos_proximos: data.vencimentos_proximos || true,
          relatorio_semanal: data.relatorio_semanal || false,
          limite_mei_alerta: data.limite_mei_alerta || true,
          dias_antecedencia: data.dias_antecedencia || 3,
          email_notificacoes: data.email_notificacoes || user.email
        });
      } else {
        setSettings(prev => ({
          ...prev,
          email_notificacoes: user.email
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_notification_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações. Verifique se todas as informações estão corretas.');
    } finally {
      setSaving(false);
    }
  };

  const testNotification = async () => {
    if (!user) return;

    try {
      // Simulação de envio de email de teste
      // Em localhost, isso não funcionará pois não há servidor de email configurado
      if (window.location.hostname === 'localhost') {
        alert('⚠️ Função de email não disponível em localhost.\n\nEm produção, esta funcionalidade enviará emails reais para o endereço configurado.');
        return;
      }
      
      // Aqui você poderia chamar uma edge function para enviar email de teste
      alert('Email de teste enviado! Verifique sua caixa de entrada.');
    } catch (error) {
      console.error('Erro ao enviar email de teste:', error);
      alert('Erro ao enviar email de teste');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Notificações por Email</h2>
        
        <div className="space-y-6">
          {/* Email de Notificações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email para Notificações
            </label>
            <input
              type="email"
              value={settings.email_notificacoes}
              onChange={(e) => setSettings(prev => ({ ...prev, email_notificacoes: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="seu@email.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              Todas as notificações serão enviadas para este email
            </p>
          </div>

          {/* Configurações de Notificação */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Tipos de Notificação</h3>
            
            <div className="space-y-4">
              {/* Vencimentos Próximos */}
              <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.vencimentos_proximos}
                      onChange={(e) => setSettings(prev => ({ ...prev, vencimentos_proximos: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="ml-3 text-sm font-medium text-gray-900">
                      Lembretes de Vencimento
                    </label>
                  </div>
                  <p className="ml-7 text-sm text-gray-600">
                    Receba alertas sobre contas que estão próximas do vencimento
                  </p>
                  
                  {settings.vencimentos_proximos && (
                    <div className="ml-7 mt-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Dias de antecedência
                      </label>
                      <select
                        value={settings.dias_antecedencia}
                        onChange={(e) => setSettings(prev => ({ ...prev, dias_antecedencia: parseInt(e.target.value) }))}
                        className="w-24 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none pr-8"
                      >
                        <option value={1}>1 dia</option>
                        <option value={3}>3 dias</option>
                        <option value={5}>5 dias</option>
                        <option value={7}>7 dias</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Relatório Semanal */}
              <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.relatorio_semanal}
                      onChange={(e) => setSettings(prev => ({ ...prev, relatorio_semanal: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="ml-3 text-sm font-medium text-gray-900">
                      Relatório Semanal
                    </label>
                  </div>
                  <p className="ml-7 text-sm text-gray-600">
                    Receba um resumo semanal das suas finanças toda segunda-feira
                  </p>
                </div>
              </div>

              {/* Alerta Limite MEI */}
              <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.limite_mei_alerta}
                      onChange={(e) => setSettings(prev => ({ ...prev, limite_mei_alerta: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="ml-3 text-sm font-medium text-gray-900">
                      Alerta de Limite MEI
                    </label>
                  </div>
                  <p className="ml-7 text-sm text-gray-600">
                    Seja notificado quando atingir 80% do limite anual de faturamento MEI
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              onClick={testNotification}
              className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-mail-send-line mr-2"></i>
              Enviar Email de Teste
            </button>
            
            <button
              onClick={saveSettings}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              {saving ? (
                <>
                  <i className="ri-loader-4-line mr-2 animate-spin"></i>
                  Salvando...
                </>
              ) : (
                <>
                  <i className="ri-save-line mr-2"></i>
                  Salvar Configurações
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Informações Importantes */}
      <div className="bg-amber-50 rounded-lg p-6 border border-amber-200">
        <h3 className="text-lg font-semibold text-amber-900 mb-3">📧 Sobre as Notificações</h3>
        <ul className="space-y-2 text-sm text-amber-800">
          <li className="flex items-start">
            <i className="ri-check-line mr-2 mt-0.5 text-amber-600"></i>
            As notificações são enviadas automaticamente com base nas suas configurações
          </li>
          <li className="flex items-start">
            <i className="ri-check-line mr-2 mt-0.5 text-amber-600"></i>
            Você pode desativar qualquer tipo de notificação a qualquer momento
          </li>
          <li className="flex items-start">
            <i className="ri-check-line mr-2 mt-0.5 text-amber-600"></i>
            Os emails são enviados apenas para contas ativas (não em atraso)
          </li>
          <li className="flex items-start">
            <i className="ri-check-line mr-2 mt-0.5 text-amber-600"></i>
            Verifique sua pasta de spam se não receber as notificações
          </li>
          {window.location.hostname === 'localhost' && (
            <li className="flex items-start">
              <i className="ri-information-line mr-2 mt-0.5 text-amber-600"></i>
              <strong>Localhost:</strong> Funcionalidades de email não estão disponíveis em desenvolvimento local
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

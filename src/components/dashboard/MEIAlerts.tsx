
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { format, addDays, isAfter, isBefore, startOfYear, endOfYear } from 'date-fns';

interface Alert {
  id: string;
  type: 'das' | 'limite' | 'vencimento' | 'backup' | 'trial';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
  color: string;
  action?: () => void;
}

export default function MEIAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [faturamentoAnual, setFaturamentoAnual] = useState(0);

  const LIMITE_MEI_2024 = 81000;

  useEffect(() => {
    if (user) {
      loadAlerts();
    }
  }, [user]);

  const loadAlerts = async () => {
    if (!user) return;

    setLoading(true);
    const newAlerts: Alert[] = [];

    try {
      // Verificar faturamento anual
      const currentYear = new Date().getFullYear();
      const startYear = startOfYear(new Date());
      const endYear = endOfYear(new Date());

      const { data: receitas } = await supabase
        .from('receitas')
        .select('valor')
        .eq('user_id', user.id)
        .gte('data', format(startYear, 'yyyy-MM-dd'))
        .lte('data', format(endYear, 'yyyy-MM-dd'));

      const totalFaturamento = receitas?.reduce((acc, item) => acc + item.valor, 0) || 0;
      setFaturamentoAnual(totalFaturamento);

      // Alert de limite MEI
      const percentualLimite = (totalFaturamento / LIMITE_MEI_2024) * 100;
      if (percentualLimite > 80) {
        newAlerts.push({
          id: 'limite-mei',
          type: 'limite',
          title: percentualLimite > 100 ? '🚨 Limite MEI Ultrapassado!' : '⚠️ Próximo do Limite MEI',
          message: `Você já utilizou ${percentualLimite.toFixed(1)}% do limite anual (R$ ${totalFaturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`,
          priority: percentualLimite > 100 ? 'high' : 'medium',
          icon: 'ri-alert-line',
          color: percentualLimite > 100 ? 'red' : 'orange'
        });
      }

      // Alert de DAS (todo dia 20)
      const hoje = new Date();
      const diaAtual = hoje.getDate();
      if (diaAtual >= 15 && diaAtual <= 20) {
        newAlerts.push({
          id: 'das-vencimento',
          type: 'das',
          title: '📅 DAS Vencendo',
          message: `O DAS vence todo dia 20. ${diaAtual === 20 ? 'Vence hoje!' : `Faltam ${20 - diaAtual} dias.`}`,
          priority: diaAtual === 20 ? 'high' : 'medium',
          icon: 'ri-calendar-line',
          color: diaAtual === 20 ? 'red' : 'orange'
        });
      }

      // Verificar contas a vencer (próximos 7 dias)
      const proximosDias = addDays(hoje, 7);
      
      const { data: contasPagar } = await supabase
        .from('contas_pagar')
        .select('*')
        .eq('user_id', user.id)
        .eq('pago', false)
        .gte('vencimento', format(hoje, 'yyyy-MM-dd'))
        .lte('vencimento', format(proximosDias, 'yyyy-MM-dd'));

      const { data: contasReceber } = await supabase
        .from('contas_receber')
        .select('*')
        .eq('user_id', user.id)
        .eq('recebido', false)
        .gte('vencimento', format(hoje, 'yyyy-MM-dd'))
        .lte('vencimento', format(proximosDias, 'yyyy-MM-dd'));

      if (contasPagar && contasPagar.length > 0) {
        const valorTotal = contasPagar.reduce((acc, conta) => acc + conta.valor, 0);
        newAlerts.push({
          id: 'contas-pagar',
          type: 'vencimento',
          title: '💳 Contas a Pagar',
          message: `${contasPagar.length} conta(s) vencem nos próximos 7 dias (${valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`,
          priority: 'medium',
          icon: 'ri-money-dollar-circle-line',
          color: 'red'
        });
      }

      if (contasReceber && contasReceber.length > 0) {
        const valorTotal = contasReceber.reduce((acc, conta) => acc + conta.valor, 0);
        newAlerts.push({
          id: 'contas-receber',
          type: 'vencimento',
          title: '💰 Contas a Receber',
          message: `${contasReceber.length} conta(s) vencem nos próximos 7 dias (${valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`,
          priority: 'medium',
          icon: 'ri-money-dollar-circle-line',
          color: 'green'
        });
      }

      // Alert de trial
      if (user.status_assinatura === 'trial') {
        const trialExpira = new Date(user.trial_expira_em);
        const diasRestantes = Math.ceil((trialExpira.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diasRestantes <= 1) {
          newAlerts.push({
            id: 'trial-expirando',
            type: 'trial',
            title: '⏰ Trial Expirando',
            message: diasRestantes === 0 ? 'Seu trial expira hoje!' : `Seu trial expira em ${diasRestantes} dia(s)`,
            priority: 'high',
            icon: 'ri-time-line',
            color: 'purple'
          });
        }
      }

      // Alert de backup (semanal)
      const ultimoBackup = localStorage.getItem('ultimo_backup');
      if (!ultimoBackup || isAfter(hoje, addDays(new Date(ultimoBackup), 7))) {
        newAlerts.push({
          id: 'backup-dados',
          type: 'backup',
          title: '💾 Backup Recomendado',
          message: 'Faça backup dos seus dados financeiros regularmente',
          priority: 'low',
          icon: 'ri-download-cloud-line',
          color: 'blue',
          action: () => realizarBackup()
        });
      }

      setAlerts(newAlerts);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  const realizarBackup = async () => {
    if (!user) return;

    try {
      // Buscar todos os dados do usuário
      const [receitas, despesas, contasPagar, contasReceber] = await Promise.all([
        supabase.from('receitas').select('*').eq('user_id', user.id),
        supabase.from('despesas').select('*').eq('user_id', user.id),
        supabase.from('contas_pagar').select('*').eq('user_id', user.id),
        supabase.from('contas_receber').select('*').eq('user_id', user.id)
      ]);

      const backupData = {
        usuario: {
          nome: user.nome,
          email: user.email,
          data_backup: new Date().toISOString()
        },
        receitas: receitas.data || [],
        despesas: despesas.data || [],
        contas_pagar: contasPagar.data || [],
        contas_receber: contasReceber.data || []
      };

      // Criar arquivo de backup
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `gestaomei_backup_${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Salvar data do último backup
      localStorage.setItem('ultimo_backup', new Date().toISOString());
      
      // Remover alert de backup
      setAlerts(prev => prev.filter(alert => alert.id !== 'backup-dados'));
      
      alert('✅ Backup realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao realizar backup:', error);
      alert('❌ Erro ao realizar backup. Tente novamente.');
    }
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-orange-200 bg-orange-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getTextColor = (color: string) => {
    switch (color) {
      case 'red': return 'text-red-700';
      case 'orange': return 'text-orange-700';
      case 'green': return 'text-green-700';
      case 'blue': return 'text-blue-700';
      case 'purple': return 'text-purple-700';
      default: return 'text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i className="ri-notification-line mr-2 text-green-600"></i>
          Alertas MEI
        </h3>
        <div className="text-center py-8">
          <i className="ri-checkbox-circle-line text-4xl text-green-500 mb-3"></i>
          <p className="text-green-700 font-medium">Tudo em ordem!</p>
          <p className="text-sm text-gray-500">Nenhum alerta no momento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <i className="ri-notification-line mr-2 text-orange-600"></i>
        Alertas MEI
        <span className="ml-2 bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
          {alerts.length}
        </span>
      </h3>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border-2 ${getPriorityColor(alert.priority)} transition-all`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <i className={`${alert.icon} text-xl ${getTextColor(alert.color)} mt-0.5`}></i>
                <div className="flex-1">
                  <h4 className={`font-semibold ${getTextColor(alert.color)} mb-1`}>
                    {alert.title}
                  </h4>
                  <p className={`text-sm ${getTextColor(alert.color)} opacity-90`}>
                    {alert.message}
                  </p>
                  {alert.action && (
                    <button
                      onClick={alert.action}
                      className={`mt-2 text-sm font-medium ${getTextColor(alert.color)} hover:underline cursor-pointer whitespace-nowrap`}
                    >
                      Realizar ação →
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer whitespace-nowrap ml-2"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Resumo do Status MEI */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Faturamento Anual:</span>
            <div className="font-semibold text-gray-900">
              {faturamentoAnual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </div>
          <div>
            <span className="text-gray-600">Limite Restante:</span>
            <div className="font-semibold text-gray-900">
              {(LIMITE_MEI_2024 - faturamentoAnual).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

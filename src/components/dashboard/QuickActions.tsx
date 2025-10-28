
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface QuickActionsProps {
  onNovaReceita: () => void;
  onNovaDespesa: () => void;
  onNovaContaPagar: () => void;
  onNovaContaReceber: () => void;
}

export default function QuickActions({ 
  onNovaReceita, 
  onNovaDespesa, 
  onNovaContaPagar, 
  onNovaContaReceber 
}: QuickActionsProps) {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Nova Receita',
      description: 'Registrar entrada de dinheiro',
      icon: 'ri-money-dollar-circle-line',
      color: 'green',
      action: onNovaReceita
    },
    {
      title: 'Nova Despesa',
      description: 'Registrar saída de dinheiro',
      icon: 'ri-shopping-cart-line',
      color: 'red',
      action: onNovaDespesa
    },
    {
      title: 'Conta a Pagar',
      description: 'Registrar conta pendente',
      icon: 'ri-file-list-line',
      color: 'orange',
      action: onNovaContaPagar
    },
    {
      title: 'Conta a Receber',
      description: 'Registrar valor a receber',
      icon: 'ri-hand-coin-line',
      color: 'blue',
      action: onNovaContaReceber
    },
    {
      title: 'Relatórios',
      description: 'Ver relatórios financeiros',
      icon: 'ri-bar-chart-line',
      color: 'purple',
      action: () => navigate('/relatorios')
    },
    {
      title: 'Calculadora DAS',
      description: 'Calcular valor do DAS',
      icon: 'ri-calculator-line',
      color: 'indigo',
      action: () => navigate('/calculadora-das')
    }
  ];

  const { user } = useAuth();

  const realizarBackup = async () => {
    if (!user) return;

    try {
      // Importar supabase dinamicamente para evitar problemas de build
      const { supabase } = await import('../../lib/supabase');
      
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
      link.download = `gestaomei_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Salvar data do último backup
      localStorage.setItem('ultimo_backup', new Date().toISOString());
      
      alert('✅ Backup realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao realizar backup:', error);
      alert('❌ Erro ao realizar backup. Tente novamente.');
    }
  };

  const handleAction = (action: any) => {
    if (action.action === 'backup') {
      realizarBackup();
    } else if (action.path) {
      navigate(action.path);
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100';
      case 'red':
        return 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100';
      case 'blue':
        return 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100';
      case 'purple':
        return 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100';
      case 'orange':
        return 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100';
      case 'indigo':
        return 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100';
      case 'gray':
        return 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <i className="ri-flashlight-line mr-2 text-blue-600"></i>
        Ações Rápidas
      </h3>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action) => (
          <button
            key={action.title}
            onClick={() => handleAction(action)}
            className={`p-5 rounded-xl border-2 transition-all cursor-pointer whitespace-nowrap text-center hover:shadow-md hover:scale-105 ${getColorClasses(action.color)}`}
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 flex items-center justify-center">
                <i className={`${action.icon} text-3xl`}></i>
              </div>
              <div className="space-y-1">
                <div className="font-semibold text-sm leading-tight">{action.title}</div>
                <div className="text-xs opacity-80 leading-tight">{action.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Dicas MEI */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <i className="ri-lightbulb-line mr-2 text-yellow-600"></i>
          💡 Dicas MEI
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
            <div className="font-semibold text-yellow-800 mb-2">📅 DAS em Dia</div>
            <div className="text-yellow-700 leading-relaxed">Pague sempre até o dia 20 para evitar multas</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <div className="font-semibold text-blue-800 mb-2">📊 Controle Financeiro</div>
            <div className="text-blue-700 leading-relaxed">Registre todas as receitas e despesas</div>
          </div>
          <div className="bg-green-50 p-4 rounded-xl border border-green-200">
            <div className="font-semibold text-green-800 mb-2">💰 Limite Anual</div>
            <div className="text-green-700 leading-relaxed">Fique atento ao limite de R$ 81.000/ano</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
            <div className="font-semibold text-purple-800 mb-2">💾 Backup Regular</div>
            <div className="text-purple-700 leading-relaxed">Faça backup dos seus dados semanalmente</div>
          </div>
        </div>
      </div>
    </div>
  );
}

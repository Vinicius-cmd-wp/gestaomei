
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function TrialBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user || user.status_assinatura !== 'trial') return null;

  const trialExpira = new Date(user.trial_expira_em);
  const hoje = new Date();
  const diasRestantes = Math.ceil((trialExpira.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

  if (diasRestantes > 1) return null;

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex items-center gap-3">
        <i className="ri-alarm-warning-line text-2xl text-yellow-600"></i>
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-800">
            ⚠️ Seu período de teste expira em {diasRestantes} dia{diasRestantes !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            Assine agora por apenas R$ 27/mês e continue aproveitando todos os recursos
          </p>
        </div>
        <button
          onClick={() => navigate('/meu-plano')}
          className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors cursor-pointer whitespace-nowrap"
        >
          Assinar Agora
        </button>
      </div>
    </div>
  );
}

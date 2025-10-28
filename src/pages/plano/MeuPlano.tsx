
import { useAuth } from '../../contexts/AuthContext';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MeuPlano() {
  const { user } = useAuth();

  if (!user) return null;

  const trialExpira = new Date(user.trial_expira_em);
  const diasRestantes = Math.ceil(differenceInDays(trialExpira, new Date()));
  const isTrial = user.status_assinatura === 'trial';
  const isExpirado = user.status_assinatura === 'expirado';
  const isAtivo = user.status_assinatura === 'ativo';
  const isCancelado = user.status_assinatura === 'cancelado';

  const beneficios = [
    { icon: 'ri-money-dollar-circle-line', text: 'Controle ilimitado de receitas e despesas' },
    { icon: 'ri-calendar-check-line', text: 'Gestão completa de contas a pagar e receber' },
    { icon: 'ri-bar-chart-line', text: 'Relatórios detalhados com gráficos' },
    { icon: 'ri-calculator-line', text: 'Cálculo automático do DAS' },
    { icon: 'ri-file-pdf-line', text: 'Exportação de relatórios em PDF' },
    { icon: 'ri-price-tag-3-line', text: 'Categorias personalizadas' },
    { icon: 'ri-customer-service-2-line', text: 'Suporte prioritário' },
    { icon: 'ri-refresh-line', text: 'Atualizações automáticas' },
  ];

  const proximaCobranca = user.data_ultima_cobranca 
    ? new Date(new Date(user.data_ultima_cobranca).getTime() + 30 * 24 * 60 * 60 * 1000)
    : null;

  const getStatusCard = () => {
    if (isTrial) {
      return (
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 lg:p-8 text-white mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6 mb-4 lg:mb-6">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="ri-time-line text-3xl lg:text-4xl"></i>
            </div>
            <div className="flex-1">
              <h2 className="text-xl lg:text-2xl font-bold mb-2">Período de Teste Gratuito</h2>
              <p className="text-blue-100 text-sm lg:text-base">
                {diasRestantes > 0 
                  ? `Restam ${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''} do seu período de teste`
                  : 'Seu período de teste expirou hoje'
                }
              </p>
              <p className="text-blue-100 text-xs lg:text-sm mt-1">
                Expira em {format(trialExpira, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            <div className="flex flex-col items-center lg:items-end">
              <div className="text-3xl lg:text-4xl font-bold">{diasRestantes > 0 ? diasRestantes : 0}</div>
              <div className="text-blue-100 text-xs lg:text-sm">dias restantes</div>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-sm lg:text-base">
              🎉 Aproveite todos os recursos premium gratuitamente durante o período de teste!
            </p>
          </div>
        </div>
      );
    }

    if (isExpirado) {
      return (
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-xl p-6 lg:p-8 text-white mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6 mb-4 lg:mb-6">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="ri-error-warning-line text-3xl lg:text-4xl"></i>
            </div>
            <div className="flex-1">
              <h2 className="text-xl lg:text-2xl font-bold mb-2">Período de Teste Expirado</h2>
              <p className="text-red-100 text-sm lg:text-base">
                Seu período de teste expirou em {format(trialExpira, "dd 'de' MMMM", { locale: ptBR })}
              </p>
              <p className="text-red-100 text-xs lg:text-sm mt-1">
                Assine agora para continuar usando todos os recursos
              </p>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-sm lg:text-base">
              ⚠️ Reative sua conta para continuar gerenciando suas finanças
            </p>
          </div>
        </div>
      );
    }

    if (isAtivo) {
      return (
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 lg:p-8 text-white mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6 mb-4 lg:mb-6">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="ri-vip-crown-fill text-3xl lg:text-4xl"></i>
            </div>
            <div className="flex-1">
              <h2 className="text-xl lg:text-2xl font-bold mb-2">Plano Premium Ativo</h2>
              <p className="text-green-100 text-sm lg:text-base">
                Você tem acesso completo a todos os recursos
              </p>
              <p className="text-green-100 text-xs lg:text-sm mt-1">
                Obrigado por confiar no FinanceMEI! 💚
              </p>
            </div>
            <div className="flex flex-col items-center lg:items-end">
              <div className="text-2xl lg:text-3xl font-bold">R$ 27</div>
              <div className="text-green-100 text-xs lg:text-sm">/mês</div>
            </div>
          </div>
          {proximaCobranca && (
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                <p className="text-green-100 text-sm">Próxima cobrança:</p>
                <p className="font-semibold text-sm lg:text-base">
                  {format(proximaCobranca, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (isCancelado) {
      return (
        <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl shadow-xl p-6 lg:p-8 text-white mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6 mb-4 lg:mb-6">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="ri-close-circle-line text-3xl lg:text-4xl"></i>
            </div>
            <div className="flex-1">
              <h2 className="text-xl lg:text-2xl font-bold mb-2">Plano Cancelado</h2>
              <p className="text-gray-100 text-sm lg:text-base">
                Sua assinatura foi cancelada
              </p>
              <p className="text-gray-100 text-xs lg:text-sm mt-1">
                Reative quando quiser para voltar a usar
              </p>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-sm lg:text-base">
              💡 Seus dados estão seguros e serão mantidos para quando você voltar
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  const getActionButton = () => {
    const baseClasses = "w-full lg:w-auto px-6 lg:px-8 py-3 lg:py-4 text-base lg:text-lg font-bold rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1";
    
    if (isTrial || isExpirado) {
      return (
        <a
          href="https://pay.cakto.com.br/38pmmdm_618893"
          target="_blank"
          rel="noopener noreferrer"
          className={`${baseClasses} ${
            isExpirado 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
          }`}
        >
          <i className="ri-vip-crown-line text-xl"></i>
          {isExpirado ? 'REATIVAR AGORA' : 'ASSINAR AGORA'}
        </a>
      );
    }

    if (isAtivo) {
      return (
        <a
          href="https://pay.cakto.com.br/38pmmdm_618893"
          target="_blank"
          rel="noopener noreferrer"
          className={`${baseClasses} bg-gray-600 hover:bg-gray-700 text-white`}
        >
          <i className="ri-settings-3-line text-xl"></i>
          Gerenciar Assinatura
        </a>
      );
    }

    if (isCancelado) {
      return (
        <a
          href="https://pay.cakto.com.br/38pmmdm_618893"
          target="_blank"
          rel="noopener noreferrer"
          className={`${baseClasses} bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white`}
        >
          <i className="ri-restart-line text-xl"></i>
          Reativar Assinatura
        </a>
      );
    }

    return null;
  };

  return (
    <div className="p-4 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6 lg:mb-8 text-center lg:text-left">
          Meu Plano
        </h1>

        {getStatusCard()}

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-6 lg:mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 lg:p-8 text-white">
            <div className="text-center">
              <div className="w-20 h-20 lg:w-24 lg:h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-vip-crown-fill text-3xl lg:text-4xl"></i>
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold mb-2">FinanceMEI Premium</h3>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-4xl lg:text-5xl font-bold">R$ 27</span>
                <span className="text-blue-100 text-lg">/mês</span>
              </div>
              <p className="text-blue-100 text-sm lg:text-base">
                Tudo que você precisa para gerenciar suas finanças como MEI
              </p>
            </div>
          </div>

          <div className="p-6 lg:p-8">
            <h4 className="text-lg lg:text-xl font-bold text-gray-900 mb-6 text-center">
              ✨ Recursos Inclusos
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
              {beneficios.map((beneficio, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className={`${beneficio.icon} text-green-600 text-lg`}></i>
                  </div>
                  <p className="text-gray-700 text-sm lg:text-base">{beneficio.text}</p>
                </div>
              ))}
            </div>

            <div className="text-center">
              {getActionButton()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <i className="ri-shield-check-line text-2xl text-blue-600"></i>
              </div>
              <h4 className="font-bold text-gray-900">Pagamento Seguro</h4>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Processado pela Cakto, plataforma de pagamentos segura e confiável. 
              Cancele quando quiser, sem multas ou taxas.
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <i className="ri-lock-line"></i>
                SSL Seguro
              </span>
              <span className="flex items-center gap-1">
                <i className="ri-bank-card-line"></i>
                Cartão
              </span>
              <span className="flex items-center gap-1">
                <i className="ri-qr-code-line"></i>
                PIX
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <i className="ri-customer-service-2-line text-2xl text-green-600"></i>
              </div>
              <h4 className="font-bold text-gray-900">Suporte Dedicado</h4>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Nossa equipe está sempre pronta para ajudar você a aproveitar ao máximo 
              o FinanceMEI e organizar suas finanças.
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <i className="ri-chat-3-line"></i>
                Chat Online
              </span>
              <span className="flex items-center gap-1">
                <i className="ri-mail-line"></i>
                Email
              </span>
              <span className="flex items-center gap-1">
                <i className="ri-phone-line"></i>
                WhatsApp
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-lightbulb-line text-3xl text-blue-600"></i>
            </div>
            <h4 className="font-bold text-gray-900 mb-2">💡 Dica do FinanceMEI</h4>
            <p className="text-sm text-gray-700">
              Mantenha suas finanças sempre organizadas e o DAS em dia para garantir seus direitos previdenciários. 
              Use nossos relatórios para planejar o crescimento do seu negócio e tomar decisões mais inteligentes!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

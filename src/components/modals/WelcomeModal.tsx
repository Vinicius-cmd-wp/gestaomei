
import { useState, useEffect } from 'react';

interface WelcomeModalProps {
  show: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ show, onClose }: WelcomeModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
    }
  }, [show]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fadeIn">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bem-vindo ao GestãoMEI!
          </h2>
          <p className="text-gray-600 mb-6">
            Você ganhou <span className="font-bold text-blue-600">2 dias de teste grátis</span> para experimentar todos os recursos
          </p>

          <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">Recursos disponíveis:</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <i className="ri-check-line text-green-600 mt-0.5"></i>
                <span>Controle completo de receitas e despesas</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="ri-check-line text-green-600 mt-0.5"></i>
                <span>Gestão de contas a pagar e receber</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="ri-check-line text-green-600 mt-0.5"></i>
                <span>Relatórios detalhados com gráficos</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="ri-check-line text-green-600 mt-0.5"></i>
                <span>Cálculo automático do DAS</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="ri-check-line text-green-600 mt-0.5"></i>
                <span>Exportação de relatórios em PDF</span>
              </li>
            </ul>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            Começar Agora
          </button>
        </div>
      </div>
    </div>
  );
}

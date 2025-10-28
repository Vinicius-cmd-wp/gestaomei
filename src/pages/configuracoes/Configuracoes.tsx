
import { useState } from 'react';
import NotificacoesEmail from './NotificacoesEmail';

export default function Configuracoes() {
  const [activeTab, setActiveTab] = useState<'geral' | 'notificacoes' | 'dados'>('geral');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
      
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('geral')}
              className={`py-4 text-sm font-medium border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'geral'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="ri-settings-line mr-2"></i>
              Geral
            </button>
            
            <button
              onClick={() => setActiveTab('notificacoes')}
              className={`py-4 text-sm font-medium border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'notificacoes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="ri-notification-line mr-2"></i>
              Notificações
            </button>
            
            <button
              onClick={() => setActiveTab('dados')}
              className={`py-4 text-sm font-medium border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'dados'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="ri-database-line mr-2"></i>
              Meus Dados
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'geral' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Configurações Gerais</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Moeda
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none pr-8">
                    <option value="BRL">Real Brasileiro (R$)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Formato de Data
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none pr-8">
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    defaultChecked
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    Mostrar valores com centavos
                  </span>
                </label>
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    defaultChecked
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    Salvar dados localmente para acesso offline
                  </span>
                </label>
              </div>
            </div>
          )}
          
          {activeTab === 'notificacoes' && <NotificacoesEmail />}
          
          {activeTab === 'dados' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Meus Dados</h2>
              
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <div className="flex items-center">
                  <i className="ri-information-line text-amber-600 text-xl mr-3"></i>
                  <div>
                    <h3 className="text-amber-800 font-semibold">Backup e Exportação</h3>
                    <p className="text-amber-700 text-sm">
                      Seus dados são automaticamente salvos na nuvem. Use os relatórios PDF para backup local.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <button className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap">
                  <i className="ri-download-line mr-2"></i>
                  Exportar Todos os Dados
                </button>
                
                <button className="w-full md:w-auto px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors cursor-pointer whitespace-nowrap">
                  <i className="ri-file-pdf-line mr-2"></i>
                  Gerar Relatório Completo
                </button>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-red-600 mb-4">Zona de Perigo</h3>
                
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <p className="text-red-700 text-sm mb-4">
                    <strong>Atenção:</strong> Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente removidos.
                  </p>
                  
                  <button className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors cursor-pointer whitespace-nowrap">
                    <i className="ri-delete-bin-line mr-2"></i>
                    Excluir Conta e Dados
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

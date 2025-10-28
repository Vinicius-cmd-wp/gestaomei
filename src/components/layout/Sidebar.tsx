
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation();
  const { signOut } = useAuth();

  const menuItems = [
    { path: '/dashboard', icon: 'ri-dashboard-line', label: 'Dashboard' },
    { path: '/receitas', icon: 'ri-arrow-up-circle-line', label: 'Receitas' },
    { path: '/despesas', icon: 'ri-arrow-down-circle-line', label: 'Despesas' },
    { path: '/contas-receber', icon: 'ri-money-dollar-circle-line', label: 'Contas a Receber' },
    { path: '/contas-pagar', icon: 'ri-money-dollar-circle-line', label: 'Contas a Pagar' },
    { path: '/relatorios', icon: 'ri-bar-chart-line', label: 'Relatórios' },
    { path: '/relatorios-pdf', icon: 'ri-file-pdf-line', label: 'Relatórios PDF' },
    { path: '/calculadora-das', icon: 'ri-calculator-line', label: 'Calculadora DAS' },
    { path: '/meu-plano', icon: 'ri-vip-crown-line', label: 'Meu Plano' },
    { path: '/configuracoes', icon: 'ri-settings-line', label: 'Configurações' },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  const handleMenuClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="bg-white h-full shadow-lg border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-600" style={{ fontFamily: '"Pacifico", serif' }}>
          GestãoMEI
        </h1>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        )}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                onClick={handleMenuClick}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  location.pathname === item.path
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <i className={`${item.icon} mr-3 text-lg`}></i>
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleSignOut}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer whitespace-nowrap"
        >
          <i className="ri-logout-circle-line mr-3 text-lg"></i>
          Sair
        </button>
      </div>
    </div>
  );
}

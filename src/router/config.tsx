
import { RouteObject } from 'react-router-dom';
import { lazy } from 'react';
import ProtectedRoute from './ProtectedRoute';

// Importações diretas para páginas críticas
import NovaReceita from '../pages/receitas/NovaReceita';
import NovaDespesa from '../pages/despesas/NovaDespesa';
import Home from '../pages/home/page';

// Lazy loading dos outros componentes
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));
const Receitas = lazy(() => import('../pages/receitas/Receitas'));
const Despesas = lazy(() => import('../pages/despesas/Despesas'));
const ContasPagar = lazy(() => import('../pages/contas/ContasPagar'));
const ContasReceber = lazy(() => import('../pages/contas/ContasReceber'));
const Relatorios = lazy(() => import('../pages/relatorios/Relatorios'));
const RelatoriosPDF = lazy(() => import('../pages/relatorios/RelatoriosPDF'));
const CalculadoraDAS = lazy(() => import('../pages/calculadora/CalculadoraDAS'));
const MeuPlano = lazy(() => import('../pages/plano/MeuPlano'));
const Configuracoes = lazy(() => import('../pages/configuracoes/Configuracoes'));
const Login = lazy(() => import('../pages/auth/Login'));
const Cadastro = lazy(() => import('../pages/auth/Cadastro'));
const RecuperarSenha = lazy(() => import('../pages/auth/RecuperarSenha'));
const NotFound = lazy(() => import('../pages/NotFound'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/cadastro',
    element: <Cadastro />,
  },
  {
    path: '/recuperar-senha',
    element: <RecuperarSenha />,
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
  },
  {
    path: '/receitas',
    element: <ProtectedRoute><Receitas /></ProtectedRoute>,
  },
  {
    path: '/nova-receita',
    element: <ProtectedRoute><NovaReceita /></ProtectedRoute>,
  },
  {
    path: '/receitas/nova',
    element: <ProtectedRoute><NovaReceita /></ProtectedRoute>,
  },
  {
    path: '/despesas',
    element: <ProtectedRoute><Despesas /></ProtectedRoute>,
  },
  {
    path: '/nova-despesa',
    element: <ProtectedRoute><NovaDespesa /></ProtectedRoute>,
  },
  {
    path: '/despesas/nova',
    element: <ProtectedRoute><NovaDespesa /></ProtectedRoute>,
  },
  {
    path: '/contas-pagar',
    element: <ProtectedRoute><ContasPagar /></ProtectedRoute>,
  },
  {
    path: '/contas-receber',
    element: <ProtectedRoute><ContasReceber /></ProtectedRoute>,
  },
  {
    path: '/relatorios',
    element: <ProtectedRoute><Relatorios /></ProtectedRoute>,
  },
  {
    path: '/relatorios-pdf',
    element: <ProtectedRoute><RelatoriosPDF /></ProtectedRoute>,
  },
  {
    path: '/calculadora-das',
    element: <ProtectedRoute><CalculadoraDAS /></ProtectedRoute>,
  },
  {
    path: '/meu-plano',
    element: <ProtectedRoute><MeuPlano /></ProtectedRoute>,
  },
  {
    path: '/configuracoes',
    element: <ProtectedRoute><Configuracoes /></ProtectedRoute>,
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

export default routes;


import { BrowserRouter } from 'react-router-dom';
import { Suspense } from 'react';
import { useRoutes } from 'react-router-dom';
import routes from './router/config';
import { AuthProvider } from './contexts/AuthContext';

function AppRoutes() {
  return useRoutes(routes);
}

function App() {
  return (
    <BrowserRouter basename={__BASE_PATH__}>
      <AuthProvider>
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-screen">
              <i className="ri-loader-4-line text-4xl text-blue-600 animate-spin"></i>
            </div>
          }
        >
          <AppRoutes />
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

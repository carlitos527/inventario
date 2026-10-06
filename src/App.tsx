import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { parseHash, navigate, type Route } from '@/lib/router';
import Layout from '@/components/Layout';
import Registro from '@/pages/Registro';
import Login from '@/pages/Login';
import Inicio from '@/pages/Inicio';
import Productos from '@/pages/Productos';
import ProductoNuevo from '@/pages/ProductoNuevo';
import Movimientos from '@/pages/Movimientos';
import Categorias from '@/pages/Categorias';
import Clientes from '@/pages/Clientes';
import Perfil from '@/pages/Perfil';
import Facturacion from '@/pages/Facturacion';

const AUTH_ROUTES: Route[] = ['registro', 'login'];

function AppContent() {
  const { session, loading } = useAuth();
  const [route, setRoute] = useState<Route>(parseHash());

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  const isAuthRoute = AUTH_ROUTES.includes(route);

  // Not logged in → only auth pages
  if (!session) {
    if (route === 'registro') return <Registro />;
    return <Login />;
  }

  // Logged in → redirect away from auth pages
  if (isAuthRoute) {
    navigate('inicio');
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  // App pages
  const pages: Record<Exclude<Route, 'registro' | 'login'>, React.ReactNode> = {
    inicio: <Inicio />,
    productos: <Productos />,
    'productos-nuevo': <ProductoNuevo />,
    movimientos: <Movimientos />,
    categorias: <Categorias />,
    clientes: <Clientes />,
    facturacion: <Facturacion />,
    perfil: <Perfil />,
  };

  return (
    <Layout current={route}>
      {pages[route as Exclude<Route, 'registro' | 'login'>] ?? <Inicio />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

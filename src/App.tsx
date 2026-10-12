import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { parseHash, navigate, type Route, PUBLIC_ROUTES } from '@/lib/router';
import Layout from '@/components/Layout';
import Catalogo from '@/pages/Catalogo';
import Carrito from '@/pages/Carrito';
import Registro from '@/pages/Registro';
import Login from '@/pages/Login';
import Admin from '@/pages/Admin';
import Productos from '@/pages/Productos';
import ProductoNuevo from '@/pages/ProductoNuevo';
import Movimientos from '@/pages/Movimientos';
import Categorias from '@/pages/Categorias';
import Clientes from '@/pages/Clientes';
import Pedidos from '@/pages/Pedidos';
import PedidoDetalle from '@/pages/PedidoDetalle';
import Motos from '@/pages/Motos';
import Facturacion from '@/pages/Facturacion';
import Contabilidad from '@/pages/Contabilidad';
import Configuracion from '@/pages/Configuracion';
import Perfil from '@/pages/Perfil';

const AUTH_ROUTES: Route[] = ['login', 'registro'];
const ADMIN_ROUTES: Route[] = [
  'admin', 'productos', 'productos-nuevo', 'movimientos', 'categorias',
  'clientes', 'pedidos', 'pedido-detalle', 'motos', 'facturacion',
  'contabilidad', 'configuracion', 'perfil',
];

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

  // Public pages (no auth required)
  if (route === 'catalogo') return <Catalogo />;
  if (route === 'carrito') return <Carrito />;

  // Auth pages
  if (route === 'login') {
    if (session) { navigate('admin'); return null; }
    return <Login />;
  }
  if (route === 'registro') {
    if (session) { navigate('admin'); return null; }
    return <Registro />;
  }

  // Admin pages - require auth
  if (!session) {
    navigate('catalogo');
    return null;
  }

  const pages: Partial<Record<Route, React.ReactNode>> = {
    admin: <Admin />,
    productos: <Productos />,
    'productos-nuevo': <ProductoNuevo />,
    movimientos: <Movimientos />,
    categorias: <Categorias />,
    clientes: <Clientes />,
    pedidos: <Pedidos />,
    'pedido-detalle': <PedidoDetalle />,
    motos: <Motos />,
    facturacion: <Facturacion />,
    contabilidad: <Contabilidad />,
    configuracion: <Configuracion />,
    perfil: <Perfil />,
  };

  const content = pages[route] ?? <Admin />;

  return (
    <Layout current={ADMIN_ROUTES.includes(route) ? route : 'admin'}>
      {content}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}

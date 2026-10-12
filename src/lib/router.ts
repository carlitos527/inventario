export type Route =
  | 'catalogo'
  | 'carrito'
  | 'login'
  | 'registro'
  | 'admin'
  | 'productos'
  | 'productos-nuevo'
  | 'movimientos'
  | 'categorias'
  | 'clientes'
  | 'pedidos'
  | 'pedido-detalle'
  | 'motos'
  | 'servicios'
  | 'facturacion'
  | 'contabilidad'
  | 'configuracion'
  | 'perfil';

const PUBLIC_ROUTES: Route[] = ['catalogo', 'carrito', 'login', 'registro'];

const validRoutes: Route[] = [
  'catalogo',
  'carrito',
  'login',
  'registro',
  'admin',
  'productos',
  'productos-nuevo',
  'movimientos',
  'categorias',
  'clientes',
  'pedidos',
  'pedido-detalle',
  'motos',
  'servicios',
  'facturacion',
  'contabilidad',
  'configuracion',
  'perfil',
];

export function parseHash(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  const route = hash || 'catalogo';
  if (validRoutes.includes(route as Route)) {
    return route as Route;
  }
  return 'catalogo';
}

export function navigate(route: Route) {
  window.location.hash = `/${route}`;
}

export function useHashRoute() {
  return parseHash();
}

export { PUBLIC_ROUTES };

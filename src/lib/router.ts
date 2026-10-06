export type Route =
  | 'registro'
  | 'login'
  | 'inicio'
  | 'productos'
  | 'productos-nuevo'
  | 'movimientos'
  | 'categorias'
  | 'clientes'
  | 'facturacion'
  | 'perfil';

const validRoutes: Route[] = [
  'registro',
  'login',
  'inicio',
  'productos',
  'productos-nuevo',
  'movimientos',
  'categorias',
  'clientes',
  'facturacion',
  'perfil',
];

export function parseHash(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  const route = hash || 'inicio';
  if (validRoutes.includes(route as Route)) {
    return route as Route;
  }
  return 'inicio';
}

export function navigate(route: Route) {
  window.location.hash = `/${route}`;
}

export function useHashRoute() {
  return parseHash();
}

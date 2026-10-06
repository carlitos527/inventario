import { useAuth } from '@/context/AuthContext';
import { navigate, type Route } from '@/lib/router';
import { getAvatarColor, getInitials } from '@/lib/utils';
import {
  Home,
  Package,
  ArrowLeftRight,
  Tags,
  User as UserIcon,
  LogOut,
  Boxes,
  FileText,
  Users,
} from 'lucide-react';

const NAV_ITEMS: { route: Route; label: string; icon: typeof Home }[] = [
  { route: 'inicio', label: 'Inicio', icon: Home },
  { route: 'productos', label: 'Productos', icon: Package },
  { route: 'movimientos', label: 'Movimientos', icon: ArrowLeftRight },
  { route: 'categorias', label: 'Categorías', icon: Tags },
  { route: 'clientes', label: 'Clientes', icon: Users },
  { route: 'facturacion', label: 'Facturación', icon: FileText },
  { route: 'perfil', label: 'Perfil', icon: UserIcon },
];

export default function Sidebar({ current }: { current: Route }) {
  const { perfil, signOut } = useAuth();

  const fullName = perfil ? `${perfil.nombre} ${perfil.apellido}` : 'Usuario';
  const initials = perfil ? getInitials(perfil.nombre, perfil.apellido) : '?';
  const avatarColor = perfil ? getAvatarColor(perfil.usuario || perfil.correo) : 'bg-slate-400';

  function handleNav(route: Route) {
    navigate(route);
  }

  function handleSignOut() {
    signOut().then(() => navigate('login'));
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-200 flex-col z-30">
        <div className="px-6 py-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center shadow-md">
              <Boxes className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-none">Stockly</h1>
              <p className="text-xs text-slate-400 mt-0.5">Inventario social</p>
            </div>
          </div>
        </div>

        {/* User card */}
        <div className="px-4 py-4">
          <button
            onClick={() => handleNav('perfil')}
            className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors text-left"
          >
            <div
              className={`w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0`}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 text-sm truncate">{fullName}</p>
              <p className="text-xs text-slate-400 truncate">@{perfil?.usuario}</p>
            </div>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = current === item.route ||
              (item.route === 'productos' && current === 'productos-nuevo');
            return (
              <button
                key={item.route}
                onClick={() => handleNav(item.route)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-sky-50 text-sky-600 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-500" />}
              </button>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center z-30 pb-safe">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = current === item.route ||
            (item.route === 'productos' && current === 'productos-nuevo');
          return (
            <button
              key={item.route}
              onClick={() => handleNav(item.route)}
              className={`flex flex-col items-center gap-1 py-2.5 px-3 transition-colors ${
                active ? 'text-sky-600' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

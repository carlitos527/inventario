import { useEffect, useState } from 'react';
import { supabase, type Producto, type Movimiento } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { navigate } from '@/lib/router';
import { formatCurrency, isToday, getAvatarColor, getInitials } from '@/lib/utils';
import { Package, AlertTriangle, ArrowLeftRight, TrendingUp, TrendingDown, Plus, FileText } from 'lucide-react';

export default function Inicio() {
  const { perfil } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [{ data: prods }, { data: movs }] = await Promise.all([
        supabase.from('productos').select('*').eq('activo', true),
        supabase.from('movimientos').select('*').order('creado_en', { ascending: false }).limit(10),
      ]);
      setProductos(prods as Producto[] || []);
      setMovimientos(movs as Movimiento[] || []);
      setLoading(false);
    }
    loadData();
  }, []);

  const totalProductos = productos.length;
  const stockBajo = productos.filter((p) => p.stock <= p.stock_minimo);
  const movimientosHoy = movimientos.filter((m) => isToday(m.creado_en));
  const valorInventario = productos.reduce((sum, p) => sum + p.precio * p.stock, 0);

  const fullName = perfil ? `${perfil.nombre} ${perfil.apellido}` : 'Usuario';
  const initials = perfil ? getInitials(perfil.nombre, perfil.apellido) : '?';
  const avatarColor = perfil ? getAvatarColor(perfil.usuario || perfil.correo) : 'bg-slate-400';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-sky-500 to-emerald-500 rounded-3xl p-6 md:p-8 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-xl flex-shrink-0`}
          >
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold">Hola, {perfil?.nombre}!</h1>
            <p className="text-white/80 text-sm mt-0.5">Aquí está el resumen de tu inventario</p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center">
              <Package className="w-6 h-6 text-sky-500" />
            </div>
            <span className="text-3xl font-bold text-slate-800">{totalProductos}</span>
          </div>
          <p className="text-slate-400 text-sm font-medium">Total productos</p>
          <p className="text-slate-600 text-sm mt-1">
            Valor: <span className="font-semibold">{formatCurrency(valorInventario)}</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <span className="text-3xl font-bold text-slate-800">{stockBajo.length}</span>
          </div>
          <p className="text-slate-400 text-sm font-medium">Stock bajo</p>
          {stockBajo.length > 0 ? (
            <p className="text-amber-600 text-sm mt-1">
              {stockBajo.slice(0, 2).map((p) => p.nombre).join(', ')}
              {stockBajo.length > 2 ? ` y ${stockBajo.length - 2} más` : ''}
            </p>
          ) : (
            <p className="text-emerald-600 text-sm mt-1">Todo en orden</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <ArrowLeftRight className="w-6 h-6 text-emerald-500" />
            </div>
            <span className="text-3xl font-bold text-slate-800">{movimientosHoy.length}</span>
          </div>
          <p className="text-slate-400 text-sm font-medium">Movimientos hoy</p>
          <p className="text-slate-600 text-sm mt-1">
            {movimientosHoy.filter((m) => m.tipo === 'entrada').length} entradas ·{' '}
            {movimientosHoy.filter((m) => m.tipo === 'salida').length} salidas
          </p>
        </div>
      </div>

      {/* Low stock products */}
      {stockBajo.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Productos con stock bajo</h2>
            <button
              onClick={() => navigate('productos')}
              className="text-sm text-sky-600 font-medium hover:underline"
            >
              Ver todos
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {stockBajo.map((p) => (
              <div key={p.id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Package className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-700 text-sm">{p.nombre}</p>
                    <p className="text-xs text-slate-400">Mínimo: {p.stock_minimo} {p.unidad}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 text-sm font-semibold">
                    {p.stock} {p.unidad}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent movements */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">Movimientos recientes</h2>
          <button
            onClick={() => navigate('movimientos')}
            className="text-sm text-sky-600 font-medium hover:underline"
          >
            Ver todos
          </button>
        </div>
        {movimientos.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <ArrowLeftRight className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No hay movimientos aún</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {movimientos.slice(0, 6).map((m) => {
              const prod = productos.find((p) => p.id === m.producto_id);
              return (
                <div key={m.id} className="px-6 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      m.tipo === 'entrada' ? 'bg-emerald-50' : 'bg-rose-50'
                    }`}
                  >
                    {m.tipo === 'entrada' ? (
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-rose-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-700 text-sm truncate">
                      {prod?.nombre ?? 'Producto eliminado'}
                    </p>
                    <p className="text-xs text-slate-400">{m.motivo || 'Sin motivo'}</p>
                  </div>
                  <span
                    className={`text-sm font-semibold flex-shrink-0 ${
                      m.tipo === 'entrada' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {m.tipo === 'entrada' ? '+' : '-'}
                    {m.cantidad}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickAction label="Nuevo producto" icon={Plus} onClick={() => navigate('productos-nuevo')} color="sky" />
        <QuickAction label="Movimiento" icon={ArrowLeftRight} onClick={() => navigate('movimientos')} color="emerald" />
        <QuickAction label="Categorías" icon={Package} onClick={() => navigate('categorias')} color="amber" />
        <QuickAction label="Facturación" icon={FileText} onClick={() => navigate('facturacion')} color="rose" />
      </div>
    </div>
  );
}

function QuickAction({
  label,
  icon: Icon,
  onClick,
  color,
}: {
  label: string;
  icon: typeof Package;
  onClick: () => void;
  color: 'sky' | 'emerald' | 'amber' | 'rose';
}) {
  const colors = {
    sky: 'bg-sky-50 text-sky-600 hover:bg-sky-100',
    emerald: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
    amber: 'bg-amber-50 text-amber-600 hover:bg-amber-100',
    rose: 'bg-rose-50 text-rose-600 hover:bg-rose-100',
  };
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${colors[color]}`}
    >
      <Icon className="w-6 h-6" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

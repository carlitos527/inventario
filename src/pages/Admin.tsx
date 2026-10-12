import { useEffect, useState } from 'react';
import { supabase, type Producto, type Pedido, type Factura } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { navigate } from '@/lib/router';
import { formatCurrency, isToday } from '@/lib/utils';
import {
  Package, ShoppingCart, FileText, Bike, Calculator, Settings, Tags, Users,
  AlertTriangle, TrendingUp, Boxes,
} from 'lucide-react';

export default function Admin() {
  const { perfil } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: prods }, { data: peds }, { data: facts }] = await Promise.all([
        supabase.from('productos').select('*').eq('activo', true),
        supabase.from('pedidos').select('*').order('creado_en', { ascending: false }).limit(20),
        supabase.from('facturas').select('*').order('creado_en', { ascending: false }).limit(20),
      ]);
      setProductos((prods as Producto[]) || []);
      setPedidos((peds as Pedido[]) || []);
      setFacturas((facts as Factura[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  const pedidosPendientes = pedidos.filter((p) => p.estado === 'pendiente');
  const ventasHoy = facturas.filter((f) => isToday(f.creado_en));
  const totalVentasHoy = ventasHoy.reduce((sum, f) => sum + Number(f.total), 0);
  const stockBajo = productos.filter((p) => p.stock <= p.stock_minimo);

  const rol = perfil?.rol || 'vendedor';
  const isWebMaster = rol === 'webmaster';
  const isAdmin = rol === 'admin' || isWebMaster;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-sky-500 to-emerald-500 rounded-3xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Panel de administración</h1>
            <p className="text-white/80 text-sm mt-0.5">
              {perfil?.nombre} {perfil?.apellido} · {rol}
            </p>
          </div>
          {isAdmin && (
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-white/20 px-3 py-1 rounded-full">{pedidos.length} pedidos</span>
              <span className="bg-white/20 px-3 py-1 rounded-full">{facturas.length} facturas</span>
              <span className="bg-white/20 px-3 py-1 rounded-full">{productos.length} productos</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={ShoppingCart} label="Pedidos pendientes" value={pedidosPendientes.length} color="sky" />
        <StatCard icon={TrendingUp} label="Ventas hoy" value={formatCurrency(totalVentasHoy)} color="emerald" />
        <StatCard icon={AlertTriangle} label="Stock bajo" value={stockBajo.length} color="amber" />
        <StatCard icon={FileText} label="Facturas emitidas" value={facturas.length} color="rose" />
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <NavCard icon={ShoppingCart} label="Pedidos" onClick={() => navigate('pedidos')} />
        <NavCard icon={Package} label="Productos" onClick={() => navigate('productos')} />
        <NavCard icon={Users} label="Clientes" onClick={() => navigate('clientes')} />
        <NavCard icon={Bike} label="Taller motos" onClick={() => navigate('motos')} />
        <NavCard icon={FileText} label="Facturación" onClick={() => navigate('facturacion')} />
        <NavCard icon={Calculator} label="Contabilidad" onClick={() => navigate('contabilidad')} />
        {isAdmin && <NavCard icon={Tags} label="Categorías" onClick={() => navigate('categorias')} />}
        {isAdmin && <NavCard icon={Boxes} label="Movimientos" onClick={() => navigate('movimientos')} />}
        {isWebMaster && <NavCard icon={Settings} label="Configuración" onClick={() => navigate('configuracion')} />}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">Pedidos recientes</h2>
          <button onClick={() => navigate('pedidos')} className="text-sm text-sky-600 font-medium hover:underline">
            Ver todos
          </button>
        </div>
        {pedidos.length === 0 ? (
          <p className="px-6 py-8 text-center text-slate-400 text-sm">No hay pedidos</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {pedidos.slice(0, 6).map((p) => (
              <button
                key={p.id}
                onClick={() => { navigate('pedido-detalle'); sessionStorage.setItem('pedido_activo', String(p.id)); }}
                className="w-full px-6 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-sky-500" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-700 text-sm">#{p.id} · {p.cliente_nombre}</p>
                    <p className="text-xs text-slate-400">{new Date(p.creado_en).toLocaleDateString('es-ES')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-600 text-sm">{formatCurrency(Number(p.total))}</span>
                  <EstadoBadge estado={p.estado} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Package; label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    sky: 'bg-sky-50 text-sky-500',
    emerald: 'bg-emerald-50 text-emerald-500',
    amber: 'bg-amber-50 text-amber-500',
    rose: 'bg-rose-50 text-rose-500',
  };
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center mb-2`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-slate-400 text-xs mt-0.5">{label}</p>
    </div>
  );
}

function NavCard({ icon: Icon, label, onClick }: { icon: typeof Package; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-sm transition-all"
    >
      <Icon className="w-6 h-6 text-slate-500" />
      <span className="text-xs font-medium text-slate-600">{label}</span>
    </button>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const colors: Record<string, string> = {
    pendiente: 'bg-amber-50 text-amber-600',
    confirmado: 'bg-sky-50 text-sky-600',
    entregado: 'bg-emerald-50 text-emerald-600',
    cancelado: 'bg-rose-50 text-rose-600',
    emitida: 'bg-sky-50 text-sky-600',
    pagada: 'bg-emerald-50 text-emerald-600',
    anulada: 'bg-rose-50 text-rose-600',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${colors[estado] || 'bg-slate-50 text-slate-500'}`}>
      {estado}
    </span>
  );
}

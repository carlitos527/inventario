import { useEffect, useState } from 'react';
import { supabase, type Pedido, type DetallePedido } from '@/lib/supabase';
import { navigate } from '@/lib/router';
import { formatCurrency } from '@/lib/utils';
import { ShoppingCart, Loader2, MessageSquare, FileText } from 'lucide-react';

export default function Pedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [detalles, setDetalles] = useState<Record<number, DetallePedido[]>>({});
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<string>('todos');

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('pedidos')
        .select('*')
        .order('creado_en', { ascending: false });
      const peds = (data as Pedido[]) || [];
      setPedidos(peds);

      if (peds.length > 0) {
        const ids = peds.map((p) => p.id);
        const { data: dets } = await supabase
          .from('detalle_pedido')
          .select('*')
          .in('pedido_id', ids);
        const map: Record<number, DetallePedido[]> = {};
        (dets as DetallePedido[] || []).forEach((d) => {
          if (!map[d.pedido_id]) map[d.pedido_id] = [];
          map[d.pedido_id].push(d);
        });
        setDetalles(map);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function updateEstado(id: number, estado: string) {
    await supabase.from('pedidos').update({ estado }).eq('id', id);
    setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, estado: estado as Pedido['estado'] } : p)));
  }

  const filtered = filtro === 'todos' ? pedidos : pedidos.filter((p) => p.estado === filtro);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pedidos</h1>
          <p className="text-slate-400 text-sm mt-0.5">{pedidos.length} pedidos totales</p>
        </div>
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-sky-400 outline-none text-slate-700 text-sm"
        >
          <option value="todos">Todos</option>
          <option value="pendiente">Pendientes</option>
          <option value="confirmado">Confirmados</option>
          <option value="entregado">Entregados</option>
          <option value="cancelado">Cancelados</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center">
          <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-400">No hay pedidos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-slate-800">#{p.id} · {p.cliente_nombre}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(p.creado_en).toLocaleString('es-ES')}
                    {p.cliente_telefono && ` · ${p.cliente_telefono}`}
                    {p.requiere_domicilio && ` · Domicilio: ${p.cliente_direccion}`}
                  </p>
                </div>
                <span className="font-bold text-sky-600">{formatCurrency(Number(p.total))}</span>
              </div>

              {detalles[p.id]?.map((d) => (
                <div key={d.id} className="flex justify-between text-sm text-slate-500 py-0.5">
                  <span>{d.cantidad}x {d.nombre_producto}</span>
                  <span>{formatCurrency(Number(d.subtotal))}</span>
                </div>
              ))}

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50">
                <select
                  value={p.estado}
                  onChange={(e) => updateEstado(p.id, e.target.value)}
                  className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 outline-none focus:border-sky-400"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="entregado">Entregado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
                <button
                  onClick={() => { navigate('pedido-detalle'); sessionStorage.setItem('pedido_activo', String(p.id)); }}
                  className="flex items-center gap-1.5 text-sm font-medium text-sky-600 hover:text-sky-700 px-3 py-1.5"
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat
                </button>
                <button
                  onClick={() => { navigate('facturacion'); sessionStorage.setItem('factura_pedido', String(p.id)); }}
                  className="flex items-center gap-1.5 text-sm font-medium text-rose-600 hover:text-rose-700 px-3 py-1.5"
                >
                  <FileText className="w-4 h-4" />
                  Facturar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

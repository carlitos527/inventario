import { useEffect, useState, useRef } from 'react';
import { supabase, type Pedido, type DetallePedido, type Mensaje } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { navigate } from '@/lib/router';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Send, Loader2, MessageSquare, ShoppingCart } from 'lucide-react';

export default function PedidoDetalle() {
  const { perfil } = useAuth();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [detalles, setDetalles] = useState<DetallePedido[]>([]);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const pedidoId = Number(sessionStorage.getItem('pedido_activo'));

  async function loadData() {
    if (!pedidoId) {
      navigate('pedidos');
      return;
    }
    const { data: ped } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId)
      .maybeSingle();
    setPedido(ped as Pedido | null);

    const { data: dets } = await supabase
      .from('detalle_pedido')
      .select('*')
      .eq('pedido_id', pedidoId);
    setDetalles((dets as DetallePedido[]) || []);

    const { data: msgs } = await supabase
      .from('mensajes')
      .select('*')
      .eq('pedido_id', pedidoId)
      .order('creado_en', { ascending: true });
    setMensajes((msgs as Mensaje[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(async () => {
      if (!pedidoId) return;
      const { data: msgs } = await supabase
        .from('mensajes')
        .select('*')
        .eq('pedido_id', pedidoId)
        .order('creado_en', { ascending: true });
      setMensajes((msgs as Mensaje[]) || []);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  async function sendMessage() {
    if (!nuevoMensaje.trim() || !pedidoId) return;
    setSending(true);
    const remitente = perfil?.rol === 'webmaster' ? 'admin' : (perfil?.rol === 'admin' ? 'admin' : 'vendedor');
    await supabase.from('mensajes').insert({
      pedido_id: pedidoId,
      contenido: nuevoMensaje.trim(),
      remitente,
      usuario_id: perfil?.id || null,
    });
    setNuevoMensaje('');
    setSending(false);
    const { data: msgs } = await supabase
      .from('mensajes')
      .select('*')
      .eq('pedido_id', pedidoId)
      .order('creado_en', { ascending: true });
    setMensajes((msgs as Mensaje[]) || []);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Pedido no encontrado</p>
        <button onClick={() => navigate('pedidos')} className="mt-3 text-sky-600 font-medium">Volver</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('pedidos')} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pedido #{pedido.id}</h1>
          <p className="text-slate-400 text-sm">{pedido.cliente_nombre} · {formatCurrency(Number(pedido.total))}</p>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingCart className="w-5 h-5 text-sky-500" />
          <h2 className="font-bold text-slate-800 text-sm">Detalle del pedido</h2>
        </div>
        {detalles.map((d) => (
          <div key={d.id} className="flex justify-between text-sm text-slate-500 py-1">
            <span>{d.cantidad}x {d.nombre_producto}</span>
            <span>{formatCurrency(Number(d.subtotal))}</span>
          </div>
        ))}
        <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between font-bold text-slate-700">
          <span>Total</span>
          <span>{formatCurrency(Number(pedido.total))}</span>
        </div>
        {pedido.requiere_domicilio && (
          <div className="mt-3 pt-3 border-t border-slate-50 text-sm text-slate-400">
            <p>Domicilio: {pedido.cliente_direccion}</p>
            <p>Teléfono: {pedido.cliente_telefono}</p>
          </div>
        )}
      </div>

      {/* Chat */}
      <div className="bg-white rounded-2xl border border-slate-100 flex flex-col" style={{ height: '400px' }}>
        <div className="px-5 py-3 border-b border-slate-50 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-emerald-500" />
          <h2 className="font-bold text-slate-800 text-sm">Chat del pedido</h2>
          <span className="ml-auto text-xs text-slate-400">Actualiza cada 5s</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {mensajes.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">No hay mensajes aún</p>
          ) : (
            mensajes.map((m) => {
              const isStaff = m.remitente !== 'cliente';
              return (
                <div key={m.id} className={`flex ${isStaff ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    isStaff ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    <p className="text-[10px] font-semibold mb-0.5 opacity-70">
                      {m.remitente === 'cliente' ? 'Cliente' : m.remitente === 'admin' ? 'Admin' : 'Vendedor'}
                    </p>
                    <p>{m.contenido}</p>
                    <p className={`text-[9px] mt-1 ${isStaff ? 'text-white/60' : 'text-slate-400'}`}>
                      {new Date(m.creado_en).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-3 border-t border-slate-50 flex gap-2">
          <input
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Escribir mensaje..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none text-slate-700 text-sm"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !nuevoMensaje.trim()}
            className="w-11 h-11 rounded-xl bg-sky-500 text-white flex items-center justify-center hover:bg-sky-600 disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import { navigate } from '@/lib/router';
import { formatCurrency } from '@/lib/utils';
import { Boxes, ShoppingCart, Plus, Minus, Trash2, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

export default function Carrito() {
  const { items, updateCantidad, removeItem, clear, total } = useCart();
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [requiereDomicilio, setRequiereDomicilio] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  // Lógica corregida: El total ya trae el IVA incluido (precio de venta al público)
  const grandTotal = total; 
  const subtotalBase = grandTotal / 1.19; // Extraemos la base gravable
  const iva = grandTotal - subtotalBase; // La diferencia es el IVA

  async function placeOrder() {
    setPlacing(true);
    const { data: pedido } = await supabase
      .from('pedidos')
      .insert({
        cliente_nombre: nombre || 'Consumidor final',
        cliente_telefono: telefono,
        cliente_direccion: requiereDomicilio ? direccion : '',
        subtotal: subtotalBase, // Guardamos la base en la BD
        iva,
        total: grandTotal,
        requiere_domicilio: requiereDomicilio,
      })
      .select()
      .single();

    if (pedido) {
      const detalles = items.map((i) => ({
        pedido_id: pedido.id,
        producto_id: i.producto.id,
        nombre_producto: i.producto.nombre,
        cantidad: i.cantidad,
        precio_unitario: Number(i.producto.precio), // Este precio ya trae IVA
        subtotal: Number(i.producto.precio) * i.cantidad,
      }));
      await supabase.from('detalle_pedido').insert(detalles);

      if (requiereDomicilio && direccion) {
        await supabase.from('domicilios').insert({
          pedido_id: pedido.id,
          direccion,
          telefono,
        });
      }

      setOrderId(pedido.id);
      clear();
    }
    setPlacing(false);
  }

  if (orderId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800">¡Pedido enviado!</h2>
          <p className="text-slate-400 text-sm mt-2">
            Tu pedido #{orderId} ha sido registrado. Un vendedor lo atenderá pronto.
          </p>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => navigate('catalogo')}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-medium hover:bg-slate-200"
            >
              Seguir comprando
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('catalogo')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-sky-500" />
            <h1 className="font-bold text-slate-800">Carrito</h1>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 text-center">
            <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400">Tu carrito está vacío</p>
            <button
              onClick={() => navigate('catalogo')}
              className="mt-4 text-sm font-semibold text-sky-600 hover:underline"
            >
              Ver catálogo
            </button>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
              {items.map((item) => (
                <div key={item.producto.id} className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                    <Boxes className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-700 text-sm truncate">{item.producto.nombre}</p>
                    <p className="text-xs text-slate-400">{formatCurrency(Number(item.producto.precio))} c/u</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateCantidad(item.producto.id, item.cantidad - 1)}
                      className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                    >
                      <Minus className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold text-slate-700">{item.cantidad}</span>
                    <button
                      onClick={() => updateCantidad(item.producto.id, item.cantidad + 1)}
                      className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </div>
                  <span className="w-20 text-right font-bold text-slate-700 text-sm">
                    {formatCurrency(Number(item.producto.precio) * item.cantidad)}
                  </span>
                  <button
                    onClick={() => removeItem(item.producto.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Customer info */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
              <h2 className="font-bold text-slate-800 text-sm">Datos del cliente</h2>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none text-slate-700 text-sm"
              />
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Teléfono"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none text-slate-700 text-sm"
              />
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={requiereDomicilio}
                  onChange={(e) => setRequiereDomicilio(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-500 focus:ring-sky-200"
                />
                Solicitar domicilio
              </label>
              {requiereDomicilio && (
                <input
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Dirección de entrega"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none text-slate-700 text-sm"
                />
              )}
            </div>

            {/* Totals - Actualizado */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex justify-between text-sm text-slate-500 mb-1">
                <span>Subtotal (Base)</span>
                <span className="font-medium">{formatCurrency(subtotalBase)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500 mb-2">
                <span>IVA (19% incluido)</span>
                <span className="font-medium">{formatCurrency(iva)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-lg font-bold text-slate-800">Total a pagar</span>
                <span className="text-xl font-bold text-sky-600">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <button
              onClick={placeOrder}
              disabled={placing}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {placing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              Enviar pedido
            </button>
          </>
        )}
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { supabase, type Movimiento, type Producto } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Plus,
  X,
  Loader2,
  Package,
} from 'lucide-react';

export default function Movimientos() {
  const { user } = useAuth();
  const [movimientos, setMovimientos] = useState<(Movimiento & { producto_nombre?: string })[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function loadData() {
    setLoading(true);
    const [{ data: movs }, { data: prods }] = await Promise.all([
      supabase.from('movimientos').select('*').order('creado_en', { ascending: false }),
      supabase.from('productos').select('*').eq('activo', true).order('nombre'),
    ]);
    const prodList = (prods as Producto[]) || [];
    setProductos(prodList);
    setMovimientos(
      ((movs as Movimiento[]) || []).map((m) => ({
        ...m,
        producto_nombre: prodList.find((p) => p.id === m.producto_id)?.nombre ?? 'Producto eliminado',
      }))
    );
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Movimientos</h1>
          <p className="text-slate-400 text-sm mt-0.5">{movimientos.length} movimientos registrados</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Registrar movimiento</span>
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        </div>
      ) : movimientos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center">
          <ArrowLeftRight className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No hay movimientos</p>
          <p className="text-slate-300 text-sm mt-1">Registra tu primer movimiento de stock</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="divide-y divide-slate-50">
            {movimientos.map((m) => (
              <div key={m.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    m.tipo === 'entrada' ? 'bg-emerald-50' : 'bg-rose-50'
                  }`}
                >
                  {m.tipo === 'entrada' ? (
                    <TrendingUp className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-rose-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-700 text-sm truncate">{m.producto_nombre}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {m.motivo || 'Sin motivo'} · {formatDate(m.creado_en)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span
                    className={`text-lg font-bold ${
                      m.tipo === 'entrada' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {m.tipo === 'entrada' ? '+' : '-'}
                    {m.cantidad}
                  </span>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                    {m.tipo}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setShowForm(true)}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 text-white shadow-xl flex items-center justify-center z-20"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modal form */}
      {showForm && (
        <MovimientoModal
          productos={productos}
          userId={user?.id}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function MovimientoModal({
  productos,
  userId,
  onClose,
  onSaved,
}: {
  productos: Producto[];
  userId: string | undefined;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [productoId, setProductoId] = useState('');
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('entrada');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedProduct = productos.find((p) => p.id === Number(productoId));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (!productoId) throw new Error('Selecciona un producto');
      const cant = Number(cantidad);
      if (!cant || cant <= 0) throw new Error('La cantidad debe ser mayor a 0');

      // Insert movimiento
      const { error: movError } = await supabase.from('movimientos').insert({
        producto_id: Number(productoId),
        tipo,
        cantidad: cant,
        motivo,
        creado_por: userId,
      });

      if (movError) throw movError;

      // Update stock from frontend (no triggers)
      const newStock =
        tipo === 'entrada'
          ? Number(selectedProduct?.stock ?? 0) + cant
          : Number(selectedProduct?.stock ?? 0) - cant;

      const { error: prodError } = await supabase
        .from('productos')
        .update({ stock: newStock })
        .eq('id', Number(productoId));

      if (prodError) throw prodError;

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar movimiento');
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition-all text-slate-700 text-sm';

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl">
          <h2 className="font-bold text-slate-800 text-lg">Registrar movimiento</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm">
              {error}
            </div>
          )}

          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Tipo de movimiento</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipo('entrada')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                  tipo === 'entrada'
                    ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-200'
                    : 'bg-slate-50 text-slate-400 border-2 border-transparent'
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                Entrada
              </button>
              <button
                type="button"
                onClick={() => setTipo('salida')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                  tipo === 'salida'
                    ? 'bg-rose-50 text-rose-600 border-2 border-rose-200'
                    : 'bg-slate-50 text-slate-400 border-2 border-transparent'
                }`}
              >
                <TrendingDown className="w-5 h-5" />
                Salida
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Producto *</label>
            <select required value={productoId} onChange={(e) => setProductoId(e.target.value)} className={inputClass}>
              <option value="">Seleccionar producto...</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} (Stock: {p.stock} {p.unidad})
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 text-sm text-slate-500">
              <Package className="w-4 h-4" />
              Stock actual: <span className="font-semibold text-slate-700">{selectedProduct.stock} {selectedProduct.unidad}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Cantidad *</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className={inputClass}
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Motivo</label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className={inputClass}
              placeholder="Ej: Compra a proveedor, venta, ajuste..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

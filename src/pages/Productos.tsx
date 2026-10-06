import { useEffect, useState } from 'react';
import { supabase, type Producto, type Categoria } from '@/lib/supabase';
import { navigate } from '@/lib/router';
import { formatCurrency } from '@/lib/utils';
import { exportProductosPDF, exportProductosExcel } from '@/lib/export';
import { Package, Plus, Search, Pencil, Trash2, X, Save, Loader2, FileText, FileSpreadsheet } from 'lucide-react';

const UNIDADES = ['unidad', 'kg', 'lb', 'litro', 'caja', 'paquete'];

export default function Productos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Producto | null>(null);

  async function loadData() {
    setLoading(true);
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('productos').select('*').eq('activo', true).order('creado_en', { ascending: false }),
      supabase.from('categorias').select('*').order('nombre'),
    ]);
    setProductos(prods as Producto[] || []);
    setCategorias(cats as Categoria[] || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = productos.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.descripcion?.toLowerCase().includes(search.toLowerCase())
  );

  function getCatNombre(id: number | null) {
    if (!id) return null;
    return categorias.find((c) => c.id === id)?.nombre ?? null;
  }

  async function deleteProducto(id: number) {
    if (!confirm('¿Marcar este producto como inactivo?')) return;
    await supabase.from('productos').update({ activo: false }).eq('id', id);
    loadData();
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Productos</h1>
          <p className="text-slate-400 text-sm mt-0.5">{productos.length} productos activos</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportProductosPDF(productos, categorias)}
            disabled={productos.length === 0}
            className="flex items-center gap-2 bg-rose-50 text-rose-600 font-semibold px-4 py-2.5 rounded-xl hover:bg-rose-100 transition-all text-sm disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden lg:inline">PDF</span>
          </button>
          <button
            onClick={() => exportProductosExcel(productos, categorias)}
            disabled={productos.length === 0}
            className="flex items-center gap-2 bg-emerald-50 text-emerald-600 font-semibold px-4 py-2.5 rounded-xl hover:bg-emerald-100 transition-all text-sm disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden lg:inline">Excel</span>
          </button>
          <button
            onClick={() => navigate('productos-nuevo')}
            className="hidden md:flex items-center gap-2 bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo producto</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar productos..."
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition-all text-slate-700 text-sm"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No hay productos</p>
          <p className="text-slate-300 text-sm mt-1">Crea tu primer producto</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const isLow = p.stock <= p.stock_minimo;
            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-50 to-emerald-50 flex items-center justify-center">
                    <Package className="w-6 h-6 text-sky-500" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditing(p)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteProducto(p.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-800 text-base mb-1">{p.nombre}</h3>
                {p.descripcion && (
                  <p className="text-slate-400 text-sm mb-3 line-clamp-2">{p.descripcion}</p>
                )}

                <div className="flex flex-wrap gap-2 mb-3">
                  {getCatNombre(p.categoria_id) && (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-500 text-xs font-medium">
                      {getCatNombre(p.categoria_id)}
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-500 text-xs font-medium">
                    {p.unidad}
                  </span>
                </div>

                <div className="flex items-end justify-between pt-3 border-t border-slate-50">
                  <div>
                    <p className="text-xs text-slate-400">Precio</p>
                    <p className="font-bold text-slate-800">{formatCurrency(Number(p.precio))}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Stock</p>
                    <span
                      className={`font-bold ${isLow ? 'text-amber-600' : 'text-emerald-600'}`}
                    >
                      {p.stock} {p.unidad}
                    </span>
                    {isLow && (
                      <p className="text-[10px] text-amber-500 font-medium">Stock bajo</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating button (mobile + desktop) */}
      <button
        onClick={() => navigate('productos-nuevo')}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 text-white shadow-xl flex items-center justify-center z-20"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Edit modal */}
      {editing && (
        <EditProductoModal
          producto={editing}
          categorias={categorias}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function EditProductoModal({
  producto,
  categorias,
  onClose,
  onSaved,
}: {
  producto: Producto;
  categorias: Categoria[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nombre, setNombre] = useState(producto.nombre);
  const [descripcion, setDescripcion] = useState(producto.descripcion || '');
  const [precio, setPrecio] = useState(String(producto.precio));
  const [stock, setStock] = useState(String(producto.stock));
  const [stockMinimo, setStockMinimo] = useState(String(producto.stock_minimo));
  const [unidad, setUnidad] = useState(producto.unidad);
  const [categoriaId, setCategoriaId] = useState(producto.categoria_id ? String(producto.categoria_id) : '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await supabase
      .from('productos')
      .update({
        nombre,
        descripcion,
        precio: Number(precio),
        stock: Number(stock),
        stock_minimo: Number(stockMinimo),
        unidad,
        categoria_id: categoriaId ? Number(categoriaId) : null,
      })
      .eq('id', producto.id);
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl">
          <h2 className="font-bold text-slate-800 text-lg">Editar producto</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <Field label="Nombre">
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Descripción">
            <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Precio">
              <input type="number" step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Unidad">
              <select value={unidad} onChange={(e) => setUnidad(e.target.value)} className={inputClass}>
                {UNIDADES.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Stock">
              <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Stock mínimo">
              <input type="number" value={stockMinimo} onChange={(e) => setStockMinimo(e.target.value)} className={inputClass} />
            </Field>
          </div>
          <Field label="Categoría">
            <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} className={inputClass}>
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="px-6 py-4 border-t border-slate-50 flex gap-3 sticky bottom-0 bg-white rounded-b-3xl">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  'w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition-all text-slate-700 text-sm';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

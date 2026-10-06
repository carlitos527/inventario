import { useEffect, useState } from 'react';
import { supabase, type Categoria, type Producto } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/utils';
import { Tags, Plus, Pencil, Trash2, X, Save, Loader2, Check } from 'lucide-react';

export default function Categorias() {
  const { user } = useAuth();
  const [categorias, setCategorias] = useState<(Categoria & { count?: number })[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [nombre, setNombre] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from('categorias').select('*').order('creado_en', { ascending: false }),
      supabase.from('productos').select('*').eq('activo', true),
    ]);
    const prodList = (prods as Producto[]) || [];
    setProductos(prodList);
    setCategorias(
      ((cats as Categoria[]) || []).map((c) => ({
        ...c,
        count: prodList.filter((p) => p.categoria_id === c.id).length,
      }))
    );
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    setSaving(true);

    if (editing) {
      await supabase.from('categorias').update({ nombre }).eq('id', editing.id);
    } else {
      await supabase.from('categorias').insert({
        nombre,
        creado_por: user?.id,
      });
    }

    setSaving(false);
    setNombre('');
    setEditing(null);
    setShowForm(false);
    loadData();
  }

  async function deleteCategoria(cat: Categoria) {
    const hasProducts = productos.some((p) => p.categoria_id === cat.id);
    if (hasProducts) {
      alert('No puedes eliminar esta categoría porque tiene productos asociados.');
      return;
    }
    if (!confirm('¿Eliminar esta categoría?')) return;
    await supabase.from('categorias').delete().eq('id', cat.id);
    loadData();
  }

  function startEdit(cat: Categoria) {
    setEditing(cat);
    setNombre(cat.nombre);
    setShowForm(true);
  }

  function openNew() {
    setEditing(null);
    setNombre('');
    setShowForm(true);
  }

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition-all text-slate-700 text-sm';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Categorías</h1>
          <p className="text-slate-400 text-sm mt-0.5">{categorias.length} categorías</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Nueva categoría</span>
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        </div>
      ) : categorias.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center">
          <Tags className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No hay categorías</p>
          <p className="text-slate-300 text-sm mt-1">Crea tu primera categoría</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categorias.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-50 to-emerald-50 flex items-center justify-center">
                    <Tags className="w-5 h-5 text-sky-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{c.nombre}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(c.creado_en)}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(c)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteCategoria(c)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-50">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-500 text-xs font-medium">
                  <Check className="w-3 h-3" />
                  {c.count} producto{c.count === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-lg">
                {editing ? 'Editar categoría' : 'Nueva categoría'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                  setNombre('');
                }}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Nombre *</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className={inputClass}
                  placeholder="Ej: Bebidas, Lácteos..."
                  autoFocus
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                    setNombre('');
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editing ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

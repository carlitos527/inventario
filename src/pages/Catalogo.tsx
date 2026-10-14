import { useEffect, useState } from 'react';
import { supabase, type Producto, type Categoria, type ConfigEmpresa } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { navigate } from '@/lib/router';
import { formatCurrency } from '@/lib/utils';
import { Boxes, ShoppingCart, Search, Plus, LogIn, Package } from 'lucide-react';

export default function Catalogo() {
  const { addItem } = useCart();
  const { count } = useCart();
  const { session } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [config, setConfig] = useState<ConfigEmpresa | null>(null);
  const [search, setSearch] = useState('');
  const [catFiltro, setCatFiltro] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: prods }, { data: cats }, { data: cfg }] = await Promise.all([
        supabase.from('productos').select('*').eq('activo', true).order('nombre'),
        supabase.from('categorias').select('*').order('nombre'),
        supabase.from('configuracion_empresa').select('*').eq('id', 1).maybeSingle(),
      ]);
      setProductos((prods as Producto[]) || []);
      setCategorias((cats as Categoria[]) || []);
      setConfig(cfg as ConfigEmpresa | null);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = productos.filter((p) => {
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFiltro === null || p.categoria_id === catFiltro;
    return matchSearch && matchCat;
  });

  const empresaNombre = config?.nombre || 'LECOR';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center shadow-sm">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 leading-none">{empresaNombre}</h1>
              <p className="text-[10px] text-slate-400 mt-0.5">Tienda online</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {session ? (
              <button
                onClick={() => navigate('admin')}
                className="text-sm font-medium text-slate-600 hover:text-sky-600 px-3 py-2"
              >
                Panel admin
              </button>
            ) : (
              <button
                onClick={() => navigate('login')}
                className="flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:text-sky-700 px-3 py-2"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Iniciar sesión</span>
              </button>
            )}
            <button
              onClick={() => navigate('carrito')}
              className="relative flex items-center gap-1.5 bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-slate-800"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Carrito</span>
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none text-slate-700 text-sm"
            />
          </div>
          <select
            value={catFiltro ?? ''}
            onChange={(e) => setCatFiltro(e.target.value ? Number(e.target.value) : null)}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-sky-400 outline-none text-slate-700 text-sm"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-3 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400">No hay productos disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col">
                {/* 👇 IMAGEN DEL PRODUCTO (o icono si no tiene) */}
                <div className="w-full aspect-square rounded-xl bg-slate-50 flex items-center justify-center mb-3 overflow-hidden">
                  {p.imagen_url ? (
                    <img
                      src={p.imagen_url}
                      alt={p.nombre}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                        const next = e.currentTarget.nextElementSibling as HTMLElement | null;
                        if (next) next.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <Package
                    className="w-10 h-10 text-slate-300"
                    style={{ display: p.imagen_url ? 'none' : 'block' }}
                  />
                </div>
                <h3 className="font-semibold text-slate-800 text-sm leading-tight line-clamp-2">{p.nombre}</h3>
                {p.descripcion && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.descripcion}</p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-slate-400">Stock:</span>
                  <span className={`text-xs font-semibold ${p.stock > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {p.stock > 0 ? `${p.stock} ${p.unidad}` : 'Agotado'}
                  </span>
                </div>
                <div className="mt-auto pt-3 flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-base">{formatCurrency(Number(p.precio))}</span>
                  <button
                    onClick={() => addItem(p)}
                    disabled={p.stock <= 0}
                    className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
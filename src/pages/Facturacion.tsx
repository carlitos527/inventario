import { useEffect, useState } from 'react';
import { supabase, type Producto, type Categoria, type Cliente } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { navigate } from '@/lib/router';
import { formatCurrency } from '@/lib/utils';
import { exportFacturaPDF, exportFacturaExcel, type FacturaItem } from '@/lib/export';
import {
  FileText,
  Plus,
  Trash2,
  Loader2,
  Package,
  Search,
  X,
  FileSpreadsheet,
  ArrowLeft,
  User,
} from 'lucide-react';

export default function Facturacion() {
  const { perfil } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [clienteManual, setClienteManual] = useState('');
  const [items, setItems] = useState<FacturaItem[]>([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [search, setSearch] = useState('');
  const [numeroFactura] = useState(() => `F-${Date.now().toString().slice(-6)}`);

  async function loadData() {
    setLoading(true);
    const [{ data: prods }, { data: cats }, { data: clis }] = await Promise.all([
      supabase.from('productos').select('*').eq('activo', true).order('nombre'),
      supabase.from('categorias').select('*').order('nombre'),
      supabase.from('clientes').select('*').order('nombre'),
    ]);
    setProductos((prods as Producto[]) || []);
    setCategorias((cats as Categoria[]) || []);
    setClientes((clis as Cliente[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredProductos = productos.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const filteredClientes = clientes.filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.documento?.toLowerCase().includes(search.toLowerCase())
  );

  const clienteNombre = clienteSeleccionado ? clienteSeleccionado.nombre : (clienteManual || 'Consumidor final');

  function addProducto(p: Producto) {
    const existing = items.find((i) => i.producto.id === p.id);
    if (existing) {
      setItems(items.map((i) =>
        i.producto.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i
      ));
    } else {
      setItems([...items, { producto: p, cantidad: 1, precio: Number(p.precio) }]);
    }
    setShowProductPicker(false);
    setSearch('');
  }

  function updateCantidad(id: number, cantidad: number) {
    if (cantidad <= 0) {
      removeItem(id);
      return;
    }
    setItems(items.map((i) => (i.producto.id === id ? { ...i, cantidad } : i)));
  }

  function updatePrecio(id: number, precio: number) {
    setItems(items.map((i) => (i.producto.id === id ? { ...i, precio } : i)));
  }

  function removeItem(id: number) {
    setItems(items.filter((i) => i.producto.id !== id));
  }

  const subtotal = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
  const iva = subtotal * 0.15;
  const total = subtotal + iva;

  const perfilNombre = perfil ? `${perfil.nombre} ${perfil.apellido}` : 'Usuario';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('inicio')}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800">Facturación</h1>
          <p className="text-slate-400 text-sm mt-0.5">Crea facturas y exportalas en PDF o Excel</p>
        </div>
      </div>

      {/* Factura info */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Cliente</label>
            {clienteSeleccionado ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50">
                  <User className="w-4 h-4 text-sky-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{clienteSeleccionado.nombre}</p>
                    {clienteSeleccionado.documento && (
                      <p className="text-xs text-slate-400 truncate">{clienteSeleccionado.documento}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setClienteSeleccionado(null);
                    setClienteManual('');
                  }}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={clienteManual}
                    onChange={(e) => setClienteManual(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition-all text-slate-700 text-sm"
                    placeholder="Nombre del cliente"
                  />
                </div>
                <button
                  onClick={() => {
                    setShowClientPicker(true);
                    setSearch('');
                  }}
                  className="flex items-center gap-1.5 bg-sky-50 text-sky-600 font-semibold px-3 py-2.5 rounded-xl hover:bg-sky-100 transition-all text-sm whitespace-nowrap"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Buscar</span>
                </button>
              </div>
            )}
            {clienteSeleccionado?.correo && (
              <p className="text-xs text-slate-400 mt-1.5">{clienteSeleccionado.correo}</p>
            )}
            {clienteSeleccionado?.telefono && (
              <p className="text-xs text-slate-400">{clienteSeleccionado.telefono}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">No. Factura</label>
            <input
              type="text"
              value={numeroFactura}
              readOnly
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-mono"
            />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">Productos de la factura</h2>
          <button
            onClick={() => {
              setShowProductPicker(true);
              setSearch('');
            }}
            className="flex items-center gap-2 bg-sky-50 text-sky-600 font-semibold px-4 py-2 rounded-xl hover:bg-sky-100 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </div>

        {items.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Agrega productos a la factura</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {items.map((item) => (
              <div key={item.producto.id} className="px-6 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-sky-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-700 text-sm truncate">{item.producto.nombre}</p>
                  <p className="text-xs text-slate-400">{item.producto.unidad}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-[10px] text-slate-400">Cant.</p>
                    <input
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(e) => updateCantidad(item.producto.id, Number(e.target.value))}
                      className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 text-center text-sm text-slate-700 focus:border-sky-400 outline-none"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Precio</p>
                    <input
                      type="number"
                      step="0.01"
                      value={item.precio}
                      onChange={(e) => updatePrecio(item.producto.id, Number(e.target.value))}
                      className="w-24 px-2 py-1.5 rounded-lg border border-slate-200 text-right text-sm text-slate-700 focus:border-sky-400 outline-none"
                    />
                  </div>
                  <div className="w-24 text-right">
                    <p className="text-[10px] text-slate-400">Subtotal</p>
                    <p className="font-bold text-slate-700 text-sm">
                      {formatCurrency(item.precio * item.cantidad)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.producto.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        {items.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex justify-between text-sm text-slate-500 mb-1">
              <span>Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500 mb-2">
              <span>IVA (15%)</span>
              <span className="font-medium">{formatCurrency(iva)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-lg font-bold text-slate-800">Total</span>
              <span className="text-xl font-bold text-sky-600">{formatCurrency(total)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Export buttons */}
      {items.length > 0 && (
        <div className="flex gap-3">
          <button
            onClick={() => exportFacturaPDF(items, clienteNombre, numeroFactura, perfilNombre)}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-orange-500 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <FileText className="w-5 h-5" />
            Exportar PDF
          </button>
          <button
            onClick={() => exportFacturaExcel(items, clienteNombre, numeroFactura, perfilNombre)}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <FileSpreadsheet className="w-5 h-5" />
            Exportar Excel
          </button>
        </div>
      )}

      {/* Product picker modal */}
      {showProductPicker && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-lg">Seleccionar producto</h2>
              <button onClick={() => setShowProductPicker(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 border-b border-slate-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none text-slate-700 text-sm"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
              {filteredProductos.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-8">No se encontraron productos</p>
              ) : (
                filteredProductos.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addProducto(p)}
                    className="w-full px-6 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-sky-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-700 text-sm truncate">{p.nombre}</p>
                      <p className="text-xs text-slate-400">Stock: {p.stock} {p.unidad}</p>
                    </div>
                    <span className="font-semibold text-slate-600 text-sm">{formatCurrency(Number(p.precio))}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Client picker modal */}
      {showClientPicker && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-lg">Seleccionar cliente</h2>
              <button onClick={() => setShowClientPicker(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 border-b border-slate-50 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar cliente..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none text-slate-700 text-sm"
                  autoFocus
                />
              </div>
              <button
                onClick={() => {
                  setShowClientPicker(false);
                  navigate('clientes');
                }}
                className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 font-semibold px-3 py-2.5 rounded-xl hover:bg-emerald-100 transition-all text-sm whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nuevo</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
              {filteredClientes.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No se encontraron clientes</p>
                  <button
                    onClick={() => {
                      setShowClientPicker(false);
                      navigate('clientes');
                    }}
                    className="mt-3 text-sm text-sky-600 font-medium hover:underline"
                  >
                    Registrar nuevo cliente
                  </button>
                </div>
              ) : (
                filteredClientes.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setClienteSeleccionado(c);
                      setClienteManual('');
                      setShowClientPicker(false);
                      setSearch('');
                    }}
                    className="w-full px-6 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-700 text-sm truncate">{c.nombre}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {c.documento || c.correo || 'Sin detalles'}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

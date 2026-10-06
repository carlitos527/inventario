import { useEffect, useState } from 'react';
import { supabase, type Cliente } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { Users, Plus, Search, Pencil, Trash2, X, Save, Loader2, Mail, Phone, MapPin, FileText } from 'lucide-react';

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [creating, setCreating] = useState(false);

  async function loadClientes() {
    setLoading(true);
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .order('creado_en', { ascending: false });
    setClientes((data as Cliente[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    loadClientes();
  }, []);

  const filtered = clientes.filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.correo?.toLowerCase().includes(search.toLowerCase()) ||
    c.documento?.toLowerCase().includes(search.toLowerCase())
  );

  async function deleteCliente(id: number) {
    if (!confirm('¿Eliminar este cliente?')) return;
    await supabase.from('clientes').delete().eq('id', id);
    loadClientes();
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
          <p className="text-slate-400 text-sm mt-0.5">{clientes.length} clientes registrados</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="hidden md:flex items-center gap-2 bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo cliente</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, correo o documento..."
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition-all text-slate-700 text-sm"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No hay clientes</p>
          <p className="text-slate-300 text-sm mt-1">Registra tu primer cliente</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-50 to-emerald-50 flex items-center justify-center">
                  <Users className="w-6 h-6 text-sky-500" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditing(c)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteCliente(c.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-slate-800 text-base mb-2">{c.nombre}</h3>

              <div className="space-y-1.5">
                {c.documento && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{c.documento}</span>
                  </div>
                )}
                {c.correo && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{c.correo}</span>
                  </div>
                )}
                {c.telefono && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{c.telefono}</span>
                  </div>
                )}
                {c.direccion && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{c.direccion}</span>
                  </div>
                )}
              </div>

              <p className="text-[10px] text-slate-300 mt-3 pt-3 border-t border-slate-50">
                Registrado {formatDate(c.creado_en)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Floating button (mobile) */}
      <button
        onClick={() => setCreating(true)}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 text-white shadow-xl flex items-center justify-center z-20"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Create modal */}
      {creating && (
        <ClienteModal
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            loadClientes();
          }}
        />
      )}

      {/* Edit modal */}
      {editing && (
        <ClienteModal
          cliente={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            loadClientes();
          }}
        />
      )}
    </div>
  );
}

function ClienteModal({
  cliente,
  onClose,
  onSaved,
}: {
  cliente?: Cliente;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nombre, setNombre] = useState(cliente?.nombre || '');
  const [correo, setCorreo] = useState(cliente?.correo || '');
  const [telefono, setTelefono] = useState(cliente?.telefono || '');
  const [direccion, setDireccion] = useState(cliente?.direccion || '');
  const [documento, setDocumento] = useState(cliente?.documento || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const payload = { nombre, correo, telefono, direccion, documento };
    if (cliente) {
      await supabase.from('clientes').update(payload).eq('id', cliente.id);
    } else {
      await supabase.from('clientes').insert(payload);
    }
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl">
          <h2 className="font-bold text-slate-800 text-lg">
            {cliente ? 'Editar cliente' : 'Nuevo cliente'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <Field label="Nombre completo">
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={inputClass}
              placeholder="Juan Pérez"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Correo">
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className={inputClass}
                placeholder="juan@email.com"
              />
            </Field>
            <Field label="Teléfono">
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className={inputClass}
                placeholder="809-555-1234"
              />
            </Field>
          </div>
          <Field label="Documento (RNC / Cédula)">
            <input
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              className={inputClass}
              placeholder="001-1234567-8"
            />
          </Field>
          <Field label="Dirección">
            <textarea
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              rows={2}
              className={inputClass}
              placeholder="Calle, número, ciudad"
            />
          </Field>
        </div>
        <div className="px-6 py-4 border-t border-slate-50 flex gap-3 sticky bottom-0 bg-white rounded-b-3xl">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !nombre.trim()}
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

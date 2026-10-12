import { useEffect, useState } from 'react';
import { supabase, type Moto, type ServicioMoto } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { Bike, Plus, Search, Pencil, Trash2, X, Save, Loader2, Wrench, Calendar } from 'lucide-react';

export default function Motos() {
  const [motos, setMotos] = useState<Moto[]>([]);
  const [servicios, setServicios] = useState<Record<number, ServicioMoto[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Moto | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedMoto, setSelectedMoto] = useState<number | null>(null);
  const [showServicio, setShowServicio] = useState(false);

  async function loadData() {
    setLoading(true);
    const [{ data: m }, { data: s }] = await Promise.all([
      supabase.from('motos').select('*').order('creado_en', { ascending: false }),
      supabase.from('servicios_moto').select('*').order('fecha', { ascending: false }),
    ]);
    const motosList = (m as Moto[]) || [];
    setMotos(motosList);
    const map: Record<number, ServicioMoto[]> = {};
    (s as ServicioMoto[] || []).forEach((sv) => {
      if (!map[sv.moto_id]) map[sv.moto_id] = [];
      map[sv.moto_id].push(sv);
    });
    setServicios(map);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const filtered = motos.filter((m) =>
    m.placa.toLowerCase().includes(search.toLowerCase()) ||
    m.propietario.toLowerCase().includes(search.toLowerCase())
  );

  async function deleteMoto(id: number) {
    if (!confirm('¿Eliminar esta moto y todos sus servicios?')) return;
    await supabase.from('motos').delete().eq('id', id);
    loadData();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  if (selectedMoto) {
    const moto = motos.find((m) => m.id === selectedMoto);
    if (!moto) { setSelectedMoto(null); return null; }
    const motoServicios = servicios[moto.id] || [];

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedMoto(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{moto.placa}</h1>
            <p className="text-slate-400 text-sm">{moto.marca} {moto.modelo} · {moto.propietario}</p>
          </div>
        </div>

        {/* Moto info */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Info label="Marca" value={moto.marca} />
          <Info label="Modelo" value={moto.modelo} />
          <Info label="Año" value={moto.anio?.toString() || '-'} />
          <Info label="Color" value={moto.color} />
          <Info label="Propietario" value={moto.propietario} />
          <Info label="Teléfono" value={moto.telefono} />
          <Info label="Kilometraje" value={`${moto.kilometraje} km`} />
        </div>

        {/* Services */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Hoja de vida - Servicios</h2>
            <button
              onClick={() => setShowServicio(true)}
              className="flex items-center gap-2 bg-sky-50 text-sky-600 font-semibold px-4 py-2 rounded-xl hover:bg-sky-100 text-sm"
            >
              <Plus className="w-4 h-4" />
              Nuevo servicio
            </button>
          </div>
          {motoServicios.length === 0 ? (
            <p className="px-5 py-8 text-center text-slate-400 text-sm">No hay servicios registrados</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {motoServicios.map((s) => (
                <div key={s.id} className="px-5 py-4">
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-medium text-slate-700 text-sm">{s.descripcion}</p>
                    <span className="font-semibold text-slate-600 text-sm">{Number(s.costo).toFixed(2)}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{s.fecha}</span>
                    {s.repuestos && <span>Repuestos: {s.repuestos}</span>}
                    {s.proximo_mantenimiento && <span className="text-amber-500">Próximo: {s.proximo_mantenimiento}</span>}
                  </div>
                  {s.observaciones && <p className="text-xs text-slate-400 mt-1">{s.observaciones}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {showServicio && (
          <ServicioModal motoId={moto.id} onClose={() => setShowServicio(false)} onSaved={() => { setShowServicio(false); loadData(); }} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Taller de motos</h1>
          <p className="text-slate-400 text-sm mt-0.5">{motos.length} motos registradas</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl text-sm"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Nueva moto</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por placa o propietario..."
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none text-slate-700 text-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center">
          <Bike className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-400">No hay motos registradas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl border border-slate-100 p-5 group hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center">
                  <Bike className="w-6 h-6 text-sky-500" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditing(m)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteMoto(m.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-slate-800 text-base">{m.placa}</h3>
              <p className="text-sm text-slate-500">{m.marca} {m.modelo} {m.anio || ''}</p>
              <div className="mt-2 space-y-0.5 text-xs text-slate-400">
                <p>{m.propietario} · {m.telefono}</p>
                <p>{m.kilometraje} km</p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                <span className="text-xs text-slate-400">{servicios[m.id]?.length || 0} servicios</span>
                <button
                  onClick={() => setSelectedMoto(m.id)}
                  className="text-sm font-medium text-sky-600 hover:underline"
                >
                  Ver hoja de vida
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && <MotoModal onClose={() => setCreating(false)} onSaved={() => { setCreating(false); loadData(); }} />}
      {editing && <MotoModal moto={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); loadData(); }} />}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-700">{value || '-'}</p>
    </div>
  );
}

const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none text-slate-700 text-sm';

function MotoModal({ moto, onClose, onSaved }: { moto?: Moto; onClose: () => void; onSaved: () => void }) {
  const [placa, setPlaca] = useState(moto?.placa || '');
  const [marca, setMarca] = useState(moto?.marca || '');
  const [modelo, setModelo] = useState(moto?.modelo || '');
  const [anio, setAnio] = useState(moto?.anio?.toString() || '');
  const [color, setColor] = useState(moto?.color || '');
  const [propietario, setPropietario] = useState(moto?.propietario || '');
  const [telefono, setTelefono] = useState(moto?.telefono || '');
  const [kilometraje, setKilometraje] = useState(moto?.kilometraje?.toString() || '0');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const payload = {
      placa, marca, modelo,
      anio: anio ? Number(anio) : null,
      color, propietario, telefono,
      kilometraje: Number(kilometraje) || 0,
    };
    if (moto) await supabase.from('motos').update(payload).eq('id', moto.id);
    else await supabase.from('motos').insert(payload);
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="font-bold text-slate-800 text-lg">{moto ? 'Editar moto' : 'Nueva moto'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Placa"><input value={placa} onChange={(e) => setPlaca(e.target.value)} className={inputClass} /></Field>
            <Field label="Propietario"><input value={propietario} onChange={(e) => setPropietario(e.target.value)} className={inputClass} /></Field>
            <Field label="Marca"><input value={marca} onChange={(e) => setMarca(e.target.value)} className={inputClass} /></Field>
            <Field label="Modelo"><input value={modelo} onChange={(e) => setModelo(e.target.value)} className={inputClass} /></Field>
            <Field label="Año"><input value={anio} onChange={(e) => setAnio(e.target.value)} className={inputClass} /></Field>
            <Field label="Color"><input value={color} onChange={(e) => setColor(e.target.value)} className={inputClass} /></Field>
            <Field label="Teléfono"><input value={telefono} onChange={(e) => setTelefono(e.target.value)} className={inputClass} /></Field>
            <Field label="Kilometraje"><input value={kilometraje} onChange={(e) => setKilometraje(e.target.value)} className={inputClass} /></Field>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-50 flex gap-3 sticky bottom-0 bg-white">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50">Cancelar</button>
          <button onClick={save} disabled={saving || !placa.trim() || !propietario.trim()} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function ServicioModal({ motoId, onClose, onSaved }: { motoId: number; onClose: () => void; onSaved: () => void }) {
  const [descripcion, setDescripcion] = useState('');
  const [repuestos, setRepuestos] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [costo, setCosto] = useState('');
  const [proximo, setProximo] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await supabase.from('servicios_moto').insert({
      moto_id: motoId,
      descripcion,
      repuestos,
      observaciones,
      costo: Number(costo) || 0,
      proximo_mantenimiento: proximo || null,
    });
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="font-bold text-slate-800 text-lg">Nuevo servicio</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-3">
          <Field label="Descripción"><input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className={inputClass} placeholder="Cambio de aceite..." /></Field>
          <Field label="Repuestos"><input value={repuestos} onChange={(e) => setRepuestos(e.target.value)} className={inputClass} placeholder="Filtro, aceite..." /></Field>
          <Field label="Costo"><input type="number" value={costo} onChange={(e) => setCosto(e.target.value)} className={inputClass} /></Field>
          <Field label="Próximo mantenimiento"><input type="date" value={proximo} onChange={(e) => setProximo(e.target.value)} className={inputClass} /></Field>
          <Field label="Observaciones"><textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={2} className={inputClass} /></Field>
        </div>
        <div className="px-6 py-4 border-t border-slate-50 flex gap-3 sticky bottom-0 bg-white">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50">Cancelar</button>
          <button onClick={save} disabled={saving || !descripcion.trim()} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />} Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-sm font-medium text-slate-600 mb-1.5">{label}</label>{children}</div>;
}

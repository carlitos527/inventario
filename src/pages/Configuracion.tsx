import { useEffect, useState } from 'react';
import { supabase, type ConfigEmpresa } from '@/lib/supabase';
import { Settings, Save, Loader2, CheckCircle2 } from 'lucide-react';

export default function Configuracion() {
  const [config, setConfig] = useState<ConfigEmpresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from('configuracion_empresa').select('*').eq('id', 1).maybeSingle()
      .then(({ data }) => {
        setConfig(data as ConfigEmpresa | null);
        setLoading(false);
      });
  }, []);

  async function save() {
    if (!config) return;
    setSaving(true);
    await supabase.from('configuracion_empresa').update({
      nombre: config.nombre,
      nit: config.nit,
      direccion: config.direccion,
      telefono: config.telefono,
      logo_url: config.logo_url,
      color_primary: config.color_primary,
      color_secondary: config.color_secondary,
    }).eq('id', 1);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none text-slate-700 text-sm';

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Configuración</h1>
        <p className="text-slate-400 text-sm mt-0.5">Datos de la empresa para facturas</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-5 h-5 text-sky-500" />
          <h2 className="font-bold text-slate-800">Datos de la empresa</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Nombre</label>
          <input value={config?.nombre || ''} onChange={(e) => setConfig({ ...config!, nombre: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">NIT / RNC</label>
          <input value={config?.nit || ''} onChange={(e) => setConfig({ ...config!, nit: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Dirección</label>
          <input value={config?.direccion || ''} onChange={(e) => setConfig({ ...config!, direccion: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Teléfono</label>
          <input value={config?.telefono || ''} onChange={(e) => setConfig({ ...config!, telefono: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">URL del logo</label>
          <input value={config?.logo_url || ''} onChange={(e) => setConfig({ ...config!, logo_url: e.target.value })} className={inputClass} placeholder="https://..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Color primario</label>
            <div className="flex items-center gap-2">
              <input type="color" value={config?.color_primary || '#0ea5e9'} onChange={(e) => setConfig({ ...config!, color_primary: e.target.value })} className="w-12 h-10 rounded-lg border border-slate-200" />
              <input value={config?.color_primary || ''} onChange={(e) => setConfig({ ...config!, color_primary: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Color secundario</label>
            <div className="flex items-center gap-2">
              <input type="color" value={config?.color_secondary || '#10b981'} onChange={(e) => setConfig({ ...config!, color_secondary: e.target.value })} className="w-12 h-10 rounded-lg border border-slate-200" />
              <input value={config?.color_secondary || ''} onChange={(e) => setConfig({ ...config!, color_secondary: e.target.value })} className={inputClass} />
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
        {saved ? 'Guardado' : 'Guardar configuración'}
      </button>
    </div>
  );
}

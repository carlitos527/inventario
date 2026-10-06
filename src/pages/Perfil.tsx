import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { getAvatarColor, getInitials, formatDate } from '@/lib/utils';
import { Save, Loader2, Mail, User as UserIcon, Calendar, Shield } from 'lucide-react';

export default function Perfil() {
  const { perfil, user, refreshPerfil } = useAuth();
  const [nombre, setNombre] = useState(perfil?.nombre ?? '');
  const [apellido, setApellido] = useState(perfil?.apellido ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!perfil) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  const avatarColor = getAvatarColor(perfil.usuario || perfil.correo);
  const initials = getInitials(perfil.nombre, perfil.apellido);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    await supabase
      .from('perfiles')
      .update({ nombre, apellido })
      .eq('id', user?.id);

    await refreshPerfil();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition-all text-slate-700 text-sm';

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Perfil</h1>
        <p className="text-slate-400 text-sm mt-0.5">Gestiona tu información personal</p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex flex-col items-center text-center">
          <div
            className={`w-24 h-24 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-3xl shadow-lg`}
          >
            {initials}
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-4">
            {perfil.nombre} {perfil.apellido}
          </h2>
          <p className="text-slate-400 text-sm">@{perfil.usuario}</p>

          <div className="flex gap-2 mt-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-sky-50 text-sky-600 text-xs font-semibold">
              <Shield className="w-3 h-3" />
              {perfil.rol}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-semibold">
              {perfil.estado}
            </span>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
        <h3 className="font-bold text-slate-800">Editar información</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Nombre</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Apellido</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>
        </div>

        {/* Read-only fields */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
            <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Correo</p>
              <p className="text-sm text-slate-600 font-medium">{perfil.correo}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
            <UserIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Usuario</p>
              <p className="text-sm text-slate-600 font-medium">@{perfil.usuario}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Miembro desde</p>
              <p className="text-sm text-slate-600 font-medium">{formatDate(perfil.fecha_creacion)}</p>
            </div>
          </div>
        </div>

        {saved && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-medium">
            Perfil actualizado correctamente
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar cambios
        </button>
      </form>
    </div>
  );
}

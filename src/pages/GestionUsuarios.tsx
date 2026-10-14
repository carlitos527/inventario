import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/lib/utils';
import { 
  Users, UserPlus, Trash2, Key, Edit2, X, Loader2, Shield, Search 
} from 'lucide-react';

type PerfilUsuario = {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  usuario: string;
  rol: string;
  estado: string;
};

export default function GestionUsuarios() {
  const { perfil: miPerfil, user } = useAuth();
  const [usuarios, setUsuarios] = useState<PerfilUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  
  // Estados del modal de crear
  const [modalCrear, setModalCrear] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '', apellido: '', correo: '', usuario: '', password: '', rol: 'vendedor'
  });
  const [creando, setCreando] = useState(false);

  // Estados del modal de editar
  const [modalEditar, setModalEditar] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<PerfilUsuario | null>(null);

  // Estados del modal de contraseña
  const [modalPassword, setModalPassword] = useState(false);
  const [usuarioPassword, setUsuarioPassword] = useState<PerfilUsuario | null>(null);
  const [nuevaPassword, setNuevaPassword] = useState('');

  const esWebmaster = miPerfil?.rol === 'webmaster';
  const esAdmin = miPerfil?.rol === 'admin';

  async function cargarUsuarios() {
    setLoading(true);
    let query = supabase.from('perfiles').select('*').order('nombre');

    if (esAdmin) {
      query = query.eq('rol', 'vendedor');
    }

    const { data, error } = await query;
    if (!error && data) setUsuarios(data as PerfilUsuario[]);
    setLoading(false);
  }

  useEffect(() => {
    cargarUsuarios();
  }, []);

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    setCreando(true);
    try {
      const { data, error } = await supabase.functions.invoke('crear-usuario', {
        body: {
          email: formData.correo,
          password: formData.password,
          nombre: formData.nombre,
          apellido: formData.apellido,
          usuario: formData.usuario,
          rol: formData.rol,
        }
      });
      if (error) throw error;
      alert('¡Usuario creado con éxito!');
      setModalCrear(false);
      setFormData({ nombre: '', apellido: '', correo: '', usuario: '', password: '', rol: 'vendedor' });
      cargarUsuarios();
    } catch (error: any) {
      alert('Error: ' + (error.message || 'No se pudo crear el usuario'));
    } finally {
      setCreando(false);
    }
  }

  async function handleEditar(e: React.FormEvent) {
    e.preventDefault();
    if (!usuarioEditando) return;
    const { error } = await supabase
      .from('perfiles')
      .update({
        nombre: usuarioEditando.nombre,
        apellido: usuarioEditando.apellido,
        rol: usuarioEditando.rol,
      })
      .eq('id', usuarioEditando.id);
    
    if (error) alert('Error: ' + error.message);
    else {
      alert('Usuario actualizado');
      setModalEditar(false);
      cargarUsuarios();
    }
  }

  async function handleEliminar(usuario: PerfilUsuario) {
    if (!confirm(`¿Eliminar a ${usuario.nombre} ${usuario.apellido}? Esto borra su acceso al sistema.`)) return;
    
    const { error } = await supabase.from('perfiles').delete().eq('id', usuario.id);
    if (error) {
      alert('Error al eliminar: ' + error.message);
    } else {
      alert('Usuario eliminado. Recuerda borrarlo también de Authentication si es necesario.');
      cargarUsuarios();
    }
  }

  async function handleCambiarPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!usuarioPassword || !nuevaPassword) return;
    
    const { error } = await supabase.functions.invoke('crear-usuario', {
      body: {
        action: 'update_password',
        userId: usuarioPassword.id,
        newPassword: nuevaPassword,
      }
    });
    
    if (error) alert('Error: ' + error.message);
    else {
      alert('Contraseña actualizada con éxito');
      setModalPassword(false);
      setNuevaPassword('');
      setUsuarioPassword(null);
    }
  }

  const usuariosFiltrados = usuarios.filter(u =>
    `${u.nombre} ${u.apellido} ${u.correo} ${u.usuario}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  const inputClass = 'w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none text-sm';

  if (!esWebmaster && !esAdmin) {
    return <div className="p-10 text-center text-slate-400">No tienes permiso para ver esta sección.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-500" /> Gestión de Usuarios
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {esWebmaster ? 'Control total de todos los usuarios' : 'Administra a tus vendedores'}
          </p>
        </div>
        <button
          onClick={() => setModalCrear(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-semibold flex items-center gap-2 hover:opacity-90 transition"
        >
          <UserPlus className="w-4 h-4" /> Crear Usuario
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, correo o usuario..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className={`${inputClass} pl-10`}
        />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="text-center py-20 text-slate-400">No hay usuarios para mostrar.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-left text-slate-500 text-xs uppercase">
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-sky-500 flex items-center justify-center text-white text-xs font-bold">
                        {getInitials(u.nombre, u.apellido)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700">{u.nombre} {u.apellido}</p>
                        <p className="text-xs text-slate-400">@{u.usuario}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.correo}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      u.rol === 'webmaster' ? 'bg-purple-50 text-purple-600' :
                      u.rol === 'admin' ? 'bg-sky-50 text-sky-600' :
                      'bg-emerald-50 text-emerald-600'
                    }`}>
                      <Shield className="w-3 h-3" /> {u.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setUsuarioEditando(u); setModalEditar(true); }}
                        className="p-2 rounded-lg hover:bg-sky-50 text-sky-500"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setUsuarioPassword(u); setModalPassword(true); }}
                        className="p-2 rounded-lg hover:bg-amber-50 text-amber-500"
                        title="Cambiar contraseña"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      {u.id !== user?.id && (
                        <button
                          onClick={() => handleEliminar(u)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL CREAR */}
      {modalCrear && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800">Crear Nuevo Usuario</h2>
              <button onClick={() => setModalCrear(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCrear} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Nombre" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className={inputClass} />
                <input required placeholder="Apellido" value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value})} className={inputClass} />
              </div>
              <input required type="email" placeholder="Correo" value={formData.correo} onChange={e => setFormData({...formData, correo: e.target.value})} className={inputClass} />
              <input required placeholder="Usuario (@ejemplo)" value={formData.usuario} onChange={e => setFormData({...formData, usuario: e.target.value})} className={inputClass} />
              <input required type="text" placeholder="Contraseña" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className={inputClass} />
              <select value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value})} className={inputClass}>
                {esWebmaster && <option value="webmaster">Webmaster</option>}
                {esWebmaster && <option value="admin">Admin</option>}
                <option value="vendedor">Vendedor</option>
              </select>
              <button type="submit" disabled={creando} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                {creando ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Crear Usuario
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {modalEditar && usuarioEditando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800">Editar Usuario</h2>
              <button onClick={() => setModalEditar(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleEditar} className="space-y-3">
              <input required value={usuarioEditando.nombre} onChange={e => setUsuarioEditando({...usuarioEditando, nombre: e.target.value})} className={inputClass} />
              <input required value={usuarioEditando.apellido} onChange={e => setUsuarioEditando({...usuarioEditando, apellido: e.target.value})} className={inputClass} />
              {esWebmaster && (
                <select value={usuarioEditando.rol} onChange={e => setUsuarioEditando({...usuarioEditando, rol: e.target.value})} className={inputClass}>
                  <option value="webmaster">Webmaster</option>
                  <option value="admin">Admin</option>
                  <option value="vendedor">Vendedor</option>
                </select>
              )}
              <button type="submit" className="w-full py-2.5 rounded-xl bg-sky-500 text-white font-semibold">
                Guardar cambios
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONTRASEÑA */}
      {modalPassword && usuarioPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800">Cambiar Contraseña</h2>
              <button onClick={() => setModalPassword(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <p className="text-sm text-slate-500 mb-3">
              Nueva contraseña para <strong>{usuarioPassword.nombre} {usuarioPassword.apellido}</strong>
            </p>
            <form onSubmit={handleCambiarPassword} className="space-y-3">
              <input
                required
                type="text"
                placeholder="Nueva contraseña"
                value={nuevaPassword}
                onChange={e => setNuevaPassword(e.target.value)}
                className={inputClass}
              />
              <button type="submit" className="w-full py-2.5 rounded-xl bg-amber-500 text-white font-semibold flex items-center justify-center gap-2">
                <Key className="w-4 h-4" /> Actualizar contraseña
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
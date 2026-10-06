import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Perfil = {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  usuario: string;
  rol: string;
  estado: string;
  fecha_creacion: string;
};

export type Categoria = {
  id: number;
  nombre: string;
  creado_por: string | null;
  creado_en: string;
};

export type Producto = {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  stock_minimo: number;
  unidad: string;
  categoria_id: number | null;
  creado_por: string | null;
  creado_en: string;
  activo: boolean;
};

export type Movimiento = {
  id: number;
  producto_id: number;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  motivo: string;
  creado_por: string | null;
  creado_en: string;
};

export type Cliente = {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  direccion: string;
  documento: string;
  creado_por: string | null;
  creado_en: string;
};

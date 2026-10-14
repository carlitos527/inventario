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
  rol: 'webmaster' | 'admin' | 'vendedor' | string;
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
  imagen_url: string | null; // 👈 ÚNICA LÍNEA NUEVA
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

export type Pedido = {
  id: number;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_direccion: string;
  cliente_correo: string;
  cliente_id: number | null;
  estado: 'pendiente' | 'confirmado' | 'entregado' | 'cancelado';
  subtotal: number;
  iva: number;
  total: number;
  requiere_domicilio: boolean;
  creado_por: string | null;
  creado_en: string;
};

export type DetallePedido = {
  id: number;
  pedido_id: number;
  producto_id: number | null;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
};

export type Domicilio = {
  id: number;
  pedido_id: number;
  direccion: string;
  telefono: string;
  estado: 'pendiente' | 'en_ruta' | 'entregado' | 'cancelado';
  moto_id: number | null;
  creado_en: string;
};

export type Mensaje = {
  id: number;
  pedido_id: number;
  contenido: string;
  remitente: 'cliente' | 'vendedor' | 'admin';
  usuario_id: string | null;
  creado_en: string;
};

export type Moto = {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
  anio: number | null;
  color: string;
  propietario: string;
  telefono: string;
  kilometraje: number;
  creado_en: string;
};

export type ServicioMoto = {
  id: number;
  moto_id: number;
  fecha: string;
  descripcion: string;
  repuestos: string;
  observaciones: string;
  costo: number;
  proximo_mantenimiento: string | null;
  factura_id: number | null;
  estado: 'completado' | 'en_proceso' | 'cancelado';
  creado_en: string;
};

export type Factura = {
  id: number;
  numero: string;
  pedido_id: number | null;
  servicio_id: number | null;
  cliente_nombre: string;
  cliente_documento: string;
  cliente_telefono: string;
  cliente_direccion: string;
  subtotal: number;
  iva: number;
  total: number;
  estado: 'emitida' | 'anulada' | 'pagada';
  creado_por: string | null;
  creado_en: string;
};

export type ConfigEmpresa = {
  id: number;
  nombre: string;
  nit: string;
  direccion: string;
  telefono: string;
  logo_url: string;
  color_primary: string;
  color_secondary: string;
};

export type Cuenta = {
  id: number;
  codigo: string;
  nombre: string;
  tipo: 'activo' | 'pasivo' | 'ingreso' | 'egreso' | 'patrimonio';
};

export type AsientoContable = {
  id: number;
  fecha: string;
  descripcion: string;
  cuenta_codigo: string;
  cuenta_nombre: string;
  debito: number;
  credito: number;
  pedido_id: number | null;
  factura_id: number | null;
  servicio_id: number | null;
  creado_por: string | null;
};
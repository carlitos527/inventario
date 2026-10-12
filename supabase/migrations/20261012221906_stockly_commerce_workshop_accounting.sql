/*
# Stockly full commerce + workshop + accounting schema

## New tables
- configuracion_empresa, motos, pedidos, detalle_pedido, domicilios, mensajes
- facturas, servicios_moto, cuentas, asientos_contables

## Security
- RLS on every new table.
- anon: SELECT productos/categorias/config/pedidos/detalle/domicilios/mensajes; INSERT pedidos/detalle/domicilios/mensajes.
- authenticated: full CRUD on management tables.
*/

-- ============================================
-- TABLE: configuracion_empresa
-- ============================================
CREATE TABLE IF NOT EXISTS configuracion_empresa (
  id smallint PRIMARY KEY DEFAULT 1,
  nombre text NOT NULL DEFAULT 'Stockly',
  nit text DEFAULT '',
  direccion text DEFAULT '',
  telefono text DEFAULT '',
  logo_url text DEFAULT '',
  color_primary text DEFAULT '#0ea5e9',
  color_secondary text DEFAULT '#10b981',
  CONSTRAINT singleton CHECK (id = 1)
);
INSERT INTO configuracion_empresa (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE configuracion_empresa ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "config_select" ON configuracion_empresa;
CREATE POLICY "config_select" ON configuracion_empresa FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "config_update" ON configuracion_empresa;
CREATE POLICY "config_update" ON configuracion_empresa FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- TABLE: motos
-- ============================================
CREATE TABLE IF NOT EXISTS motos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  placa text NOT NULL,
  marca text DEFAULT '',
  modelo text DEFAULT '',
  anio int,
  color text DEFAULT '',
  propietario text NOT NULL,
  telefono text DEFAULT '',
  kilometraje numeric DEFAULT 0,
  creado_en timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE motos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "motos_select" ON motos;
CREATE POLICY "motos_select" ON motos FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "motos_insert" ON motos;
CREATE POLICY "motos_insert" ON motos FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "motos_update" ON motos;
CREATE POLICY "motos_update" ON motos FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "motos_delete" ON motos;
CREATE POLICY "motos_delete" ON motos FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- ============================================
-- TABLE: pedidos
-- ============================================
CREATE TABLE IF NOT EXISTS pedidos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cliente_nombre text NOT NULL,
  cliente_telefono text DEFAULT '',
  cliente_direccion text DEFAULT '',
  cliente_correo text DEFAULT '',
  cliente_id bigint,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','confirmado','entregado','cancelado')),
  subtotal numeric NOT NULL DEFAULT 0,
  iva numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  requiere_domicilio boolean NOT NULL DEFAULT false,
  creado_por uuid,
  creado_en timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pedidos_select" ON pedidos;
CREATE POLICY "pedidos_select" ON pedidos FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "pedidos_insert" ON pedidos;
CREATE POLICY "pedidos_insert" ON pedidos FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "pedidos_update" ON pedidos;
CREATE POLICY "pedidos_update" ON pedidos FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "pedidos_delete" ON pedidos;
CREATE POLICY "pedidos_delete" ON pedidos FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'pedidos_cliente_id_fkey') THEN
    ALTER TABLE pedidos ADD CONSTRAINT pedidos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- TABLE: detalle_pedido
-- ============================================
CREATE TABLE IF NOT EXISTS detalle_pedido (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pedido_id bigint NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id bigint REFERENCES productos(id) ON DELETE SET NULL,
  nombre_producto text NOT NULL,
  cantidad numeric NOT NULL,
  precio_unitario numeric NOT NULL,
  subtotal numeric NOT NULL
);
ALTER TABLE detalle_pedido ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "detalle_select" ON detalle_pedido;
CREATE POLICY "detalle_select" ON detalle_pedido FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "detalle_insert" ON detalle_pedido;
CREATE POLICY "detalle_insert" ON detalle_pedido FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "detalle_update" ON detalle_pedido;
CREATE POLICY "detalle_update" ON detalle_pedido FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "detalle_delete" ON detalle_pedido;
CREATE POLICY "detalle_delete" ON detalle_pedido FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- ============================================
-- TABLE: domicilios
-- ============================================
CREATE TABLE IF NOT EXISTS domicilios (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pedido_id bigint NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  direccion text NOT NULL,
  telefono text NOT NULL,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','en_ruta','entregado','cancelado')),
  moto_id bigint REFERENCES motos(id) ON DELETE SET NULL,
  creado_en timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE domicilios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "domicilios_select" ON domicilios;
CREATE POLICY "domicilios_select" ON domicilios FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "domicilios_insert" ON domicilios;
CREATE POLICY "domicilios_insert" ON domicilios FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "domicilios_update" ON domicilios;
CREATE POLICY "domicilios_update" ON domicilios FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "domicilios_delete" ON domicilios;
CREATE POLICY "domicilios_delete" ON domicilios FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- ============================================
-- TABLE: mensajes
-- ============================================
CREATE TABLE IF NOT EXISTS mensajes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pedido_id bigint NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  contenido text NOT NULL,
  remitente text NOT NULL DEFAULT 'cliente' CHECK (remitente IN ('cliente','vendedor','admin')),
  usuario_id uuid,
  creado_en timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mensajes_select" ON mensajes;
CREATE POLICY "mensajes_select" ON mensajes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "mensajes_insert" ON mensajes;
CREATE POLICY "mensajes_insert" ON mensajes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "mensajes_delete" ON mensajes;
CREATE POLICY "mensajes_delete" ON mensajes FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- ============================================
-- TABLE: facturas
-- ============================================
CREATE TABLE IF NOT EXISTS facturas (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  numero text NOT NULL UNIQUE,
  pedido_id bigint REFERENCES pedidos(id) ON DELETE SET NULL,
  servicio_id bigint,
  cliente_nombre text NOT NULL,
  cliente_documento text DEFAULT '',
  cliente_telefono text DEFAULT '',
  cliente_direccion text DEFAULT '',
  subtotal numeric NOT NULL DEFAULT 0,
  iva numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'emitida' CHECK (estado IN ('emitida','anulada','pagada')),
  creado_por uuid,
  creado_en timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE facturas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "facturas_select" ON facturas;
CREATE POLICY "facturas_select" ON facturas FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "facturas_insert" ON facturas;
CREATE POLICY "facturas_insert" ON facturas FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "facturas_update" ON facturas;
CREATE POLICY "facturas_update" ON facturas FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "facturas_delete" ON facturas;
CREATE POLICY "facturas_delete" ON facturas FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- ============================================
-- TABLE: servicios_moto
-- ============================================
CREATE TABLE IF NOT EXISTS servicios_moto (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  moto_id bigint NOT NULL REFERENCES motos(id) ON DELETE CASCADE,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  descripcion text NOT NULL,
  repuestos text DEFAULT '',
  observaciones text DEFAULT '',
  costo numeric NOT NULL DEFAULT 0,
  proximo_mantenimiento date,
  factura_id bigint REFERENCES facturas(id) ON DELETE SET NULL,
  estado text NOT NULL DEFAULT 'completado' CHECK (estado IN ('completado','en_proceso','cancelado')),
  creado_en timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE servicios_moto ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "servicios_select" ON servicios_moto;
CREATE POLICY "servicios_select" ON servicios_moto FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "servicios_insert" ON servicios_moto;
CREATE POLICY "servicios_insert" ON servicios_moto FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "servicios_update" ON servicios_moto;
CREATE POLICY "servicios_update" ON servicios_moto FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "servicios_delete" ON servicios_moto;
CREATE POLICY "servicios_delete" ON servicios_moto FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- ============================================
-- TABLE: cuentas
-- ============================================
CREATE TABLE IF NOT EXISTS cuentas (
  id smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo text NOT NULL UNIQUE,
  nombre text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('activo','pasivo','ingreso','egreso','patrimonio'))
);
ALTER TABLE cuentas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cuentas_select" ON cuentas;
CREATE POLICY "cuentas_select" ON cuentas FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
INSERT INTO cuentas (codigo, nombre, tipo) VALUES
  ('1100','Caja','activo'),
  ('1200','Cuentas por cobrar','activo'),
  ('2100','IVA por pagar','pasivo'),
  ('4100','Ingresos por ventas','ingreso'),
  ('5100','Costo de mercancía vendida','egreso'),
  ('5200','Costo de servicios','egreso')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- TABLE: asientos_contables
-- ============================================
CREATE TABLE IF NOT EXISTS asientos_contables (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fecha timestamptz NOT NULL DEFAULT now(),
  descripcion text NOT NULL,
  cuenta_codigo text NOT NULL,
  cuenta_nombre text NOT NULL,
  debito numeric NOT NULL DEFAULT 0,
  credito numeric NOT NULL DEFAULT 0,
  pedido_id bigint REFERENCES pedidos(id) ON DELETE SET NULL,
  factura_id bigint REFERENCES facturas(id) ON DELETE SET NULL,
  servicio_id bigint REFERENCES servicios_moto(id) ON DELETE SET NULL,
  creado_por uuid
);
ALTER TABLE asientos_contables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "asientos_select" ON asientos_contables;
CREATE POLICY "asientos_select" ON asientos_contables FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "asientos_insert" ON asientos_contables;
CREATE POLICY "asientos_insert" ON asientos_contables FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "asientos_update" ON asientos_contables;
CREATE POLICY "asientos_update" ON asientos_contables FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "asientos_delete" ON asientos_contables;
CREATE POLICY "asientos_delete" ON asientos_contables FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- ============================================
-- Update roles and open catalog
-- ============================================
ALTER TABLE perfiles ALTER COLUMN rol SET DEFAULT 'vendedor';
UPDATE perfiles SET rol = 'vendedor' WHERE rol = 'usuario';

DROP POLICY IF EXISTS "productos_select" ON productos;
CREATE POLICY "productos_select" ON productos FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "categorias_select" ON categorias;
CREATE POLICY "categorias_select" ON categorias FOR SELECT TO anon, authenticated USING (true);

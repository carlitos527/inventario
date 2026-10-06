/*
# Create inventory social app tables

## Overview
Creates 4 tables for a social-network-style inventory management app:
perfiles, categorias, productos, movimientos. No triggers, no RPC functions.
All stock updates are handled from the frontend.

## New Tables

### perfiles
- id (uuid, PK, FK to auth.users) — links to the authenticated user
- nombre (text) — first name
- apellido (text) — last name
- correo (text) — email
- usuario (text, UNIQUE) — username (email prefix before @)
- rol (text, DEFAULT 'usuario') — role
- estado (text, DEFAULT 'activo') — status
- fecha_creacion (timestamptz, DEFAULT now())

### categorias
- id (bigint identity, PK) — auto-incrementing ID
- nombre (text) — category name
- creado_por (uuid) — user who created it
- creado_en (timestamptz, DEFAULT now())

### productos
- id (bigint identity, PK) — auto-incrementing ID
- nombre (text) — product name
- descripcion (text) — description
- precio (numeric) — price
- stock (numeric, DEFAULT 0) — current stock
- stock_minimo (numeric, DEFAULT 5) — minimum stock threshold
- unidad (text, DEFAULT 'unidad') — unit of measurement
- categoria_id (bigint, FK to categorias) — category reference
- creado_por (uuid) — user who created it
- creado_en (timestamptz, DEFAULT now())
- activo (boolean, DEFAULT true) — soft delete flag

### movimientos
- id (bigint identity, PK) — auto-incrementing ID
- producto_id (bigint, FK to productos) — product reference
- tipo (text, CHECK in 'entrada','salida') — movement type
- cantidad (numeric) — quantity moved
- motivo (text) — reason for movement
- creado_por (uuid) — user who registered it
- creado_en (timestamptz, DEFAULT now())

## Security (RLS)
- All tables have RLS enabled.
- All tables allow SELECT/INSERT/UPDATE/DELETE for authenticated users (auth.uid() IS NOT NULL).
- perfiles table: UPDATE restricted to own profile (id = auth.uid()).
*/

-- ============================================
-- TABLE: perfiles
-- ============================================
CREATE TABLE IF NOT EXISTS perfiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  apellido text NOT NULL,
  correo text NOT NULL,
  usuario text UNIQUE NOT NULL,
  rol text NOT NULL DEFAULT 'usuario',
  estado text NOT NULL DEFAULT 'activo',
  fecha_creacion timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "perfiles_select" ON perfiles;
CREATE POLICY "perfiles_select" ON perfiles FOR SELECT
  TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "perfiles_insert" ON perfiles;
CREATE POLICY "perfiles_insert" ON perfiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "perfiles_update_own" ON perfiles;
CREATE POLICY "perfiles_update_own" ON perfiles FOR UPDATE
  TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "perfiles_delete_own" ON perfiles;
CREATE POLICY "perfiles_delete_own" ON perfiles FOR DELETE
  TO authenticated USING (id = auth.uid());

-- ============================================
-- TABLE: categorias
-- ============================================
CREATE TABLE IF NOT EXISTS categorias (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre text NOT NULL,
  creado_por uuid,
  creado_en timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categorias_select" ON categorias;
CREATE POLICY "categorias_select" ON categorias FOR SELECT
  TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "categorias_insert" ON categorias;
CREATE POLICY "categorias_insert" ON categorias FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "categorias_update" ON categorias;
CREATE POLICY "categorias_update" ON categorias FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "categorias_delete" ON categorias;
CREATE POLICY "categorias_delete" ON categorias FOR DELETE
  TO authenticated USING (auth.uid() IS NOT NULL);

-- ============================================
-- TABLE: productos
-- ============================================
CREATE TABLE IF NOT EXISTS productos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text DEFAULT '',
  precio numeric NOT NULL DEFAULT 0,
  stock numeric NOT NULL DEFAULT 0,
  stock_minimo numeric NOT NULL DEFAULT 5,
  unidad text NOT NULL DEFAULT 'unidad',
  categoria_id bigint REFERENCES categorias(id) ON DELETE SET NULL,
  creado_por uuid,
  creado_en timestamptz NOT NULL DEFAULT now(),
  activo boolean NOT NULL DEFAULT true
);

ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "productos_select" ON productos;
CREATE POLICY "productos_select" ON productos FOR SELECT
  TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "productos_insert" ON productos;
CREATE POLICY "productos_insert" ON productos FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "productos_update" ON productos;
CREATE POLICY "productos_update" ON productos FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "productos_delete" ON productos;
CREATE POLICY "productos_delete" ON productos FOR DELETE
  TO authenticated USING (auth.uid() IS NOT NULL);

-- ============================================
-- TABLE: movimientos
-- ============================================
CREATE TABLE IF NOT EXISTS movimientos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  producto_id bigint NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('entrada','salida')),
  cantidad numeric NOT NULL,
  motivo text DEFAULT '',
  creado_por uuid,
  creado_en timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE movimientos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "movimientos_select" ON movimientos;
CREATE POLICY "movimientos_select" ON movimientos FOR SELECT
  TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "movimientos_insert" ON movimientos;
CREATE POLICY "movimientos_insert" ON movimientos FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "movimientos_update" ON movimientos;
CREATE POLICY "movimientos_update" ON movimientos FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "movimientos_delete" ON movimientos;
CREATE POLICY "movimientos_delete" ON movimientos FOR DELETE
  TO authenticated USING (auth.uid() IS NOT NULL);
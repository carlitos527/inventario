/*
# Create clientes table

## Overview
Adds a `clientes` table to store reusable customer data for the billing/facturacion module.
Customers can be selected when creating invoices instead of typing the name manually.

## New Tables

### clientes
- id (bigint identity, PK) — auto-incrementing ID
- nombre (text, NOT NULL) — customer full name
- correo (text) — email address
- telefono (text) — phone number
- direccion (text) — physical address
- documento (text) — RNC / cédula / tax ID
- creado_por (uuid) — user who created it
- creado_en (timestamptz, DEFAULT now()) — creation timestamp

## Security (RLS)
- RLS enabled on `clientes`.
- All CRUD operations allowed for authenticated users (auth.uid() IS NOT NULL).
- Same policy pattern as existing tables (categorias, productos, movimientos).
*/

CREATE TABLE IF NOT EXISTS clientes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre text NOT NULL,
  correo text DEFAULT '',
  telefono text DEFAULT '',
  direccion text DEFAULT '',
  documento text DEFAULT '',
  creado_por uuid,
  creado_en timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clientes_select" ON clientes;
CREATE POLICY "clientes_select" ON clientes FOR SELECT
  TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "clientes_insert" ON clientes;
CREATE POLICY "clientes_insert" ON clientes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "clientes_update" ON clientes;
CREATE POLICY "clientes_update" ON clientes FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "clientes_delete" ON clientes;
CREATE POLICY "clientes_delete" ON clientes FOR DELETE
  TO authenticated USING (auth.uid() IS NOT NULL);

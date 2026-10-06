import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Producto, Categoria } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';

export function exportProductosPDF(productos: Producto[], categorias: Categoria[]) {
  const doc = new jsPDF({ orientation: 'landscape' });

  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text('Stockly - Reporte de Productos', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 14, 27);
  doc.text(`Total: ${productos.length} productos`, 14, 33);

  const valorTotal = productos.reduce((sum, p) => sum + Number(p.precio) * Number(p.stock), 0);
  doc.text(`Valor total del inventario: ${formatCurrency(valorTotal)}`, 14, 39);

  const catNombre = (id: number | null) => {
    if (!id) return 'Sin categoria';
    return categorias.find((c) => c.id === id)?.nombre ?? 'Sin categoria';
  };

  autoTable(doc, {
    startY: 45,
    head: [['ID', 'Nombre', 'Descripcion', 'Categoria', 'Unidad', 'Precio', 'Stock', 'Stock Min.', 'Estado']],
    body: productos.map((p) => [
      p.id,
      p.nombre,
      p.descripcion || '-',
      catNombre(p.categoria_id),
      p.unidad,
      formatCurrency(Number(p.precio)),
      `${p.stock}`,
      `${p.stock_minimo}`,
      p.stock <= p.stock_minimo ? 'Stock bajo' : 'OK',
    ]),
    headStyles: { fillColor: [14, 165, 233], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 15 } },
  });

  doc.save('productos_stockly.pdf');
}

export function exportProductosExcel(productos: Producto[], categorias: Categoria[]) {
  const catNombre = (id: number | null) => {
    if (!id) return 'Sin categoria';
    return categorias.find((c) => c.id === id)?.nombre ?? 'Sin categoria';
  };

  const data = productos.map((p) => ({
    ID: p.id,
    Nombre: p.nombre,
    Descripcion: p.descripcion || '',
    Categoria: catNombre(p.categoria_id),
    Unidad: p.unidad,
    Precio: Number(p.precio),
    Stock: Number(p.stock),
    'Stock Minimo': Number(p.stock_minimo),
    'Valor Total': Number(p.precio) * Number(p.stock),
    Estado: p.stock <= p.stock_minimo ? 'Stock bajo' : 'OK',
    'Fecha Creacion': formatDate(p.creado_en),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 6 }, { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 10 },
    { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 22 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Productos');
  XLSX.writeFile(wb, 'productos_stockly.xlsx');
}

export type FacturaItem = {
  producto: Producto;
  cantidad: number;
  precio: number;
};

export function exportFacturaPDF(
  items: FacturaItem[],
  cliente: string,
  numeroFactura: string,
  perfilNombre: string
) {
  const doc = new jsPDF();

  const margin = 14;
  let y = 20;

  doc.setFontSize(24);
  doc.setTextColor(14, 165, 233);
  doc.text('Stockly', margin, y);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  y += 6;
  doc.text('Sistema de Inventario', margin, y);

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(`Factura ${numeroFactura}`, 196, y, { align: 'right' });

  y += 10;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, 196, y);

  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Cliente: ${cliente}`, margin, y);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 196, y, { align: 'right' });

  y += 6;
  doc.text(`Vendedor: ${perfilNombre}`, margin, y);

  y += 8;

  const body = items.map((item) => [
    item.producto.nombre,
    item.cantidad.toString(),
    formatCurrency(item.precio),
    formatCurrency(item.precio * item.cantidad),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Producto', 'Cantidad', 'Precio Unit.', 'Subtotal']],
    body,
    headStyles: { fillColor: [14, 165, 233], textColor: 255 },
    bodyStyles: { fontSize: 10 },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  const subtotal = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
  const iva = subtotal * 0.15;
  const total = subtotal + iva;

  y = finalY + 10;

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal:', 140, y);
  doc.text(formatCurrency(subtotal), 196, y, { align: 'right' });

  y += 7;
  doc.text('IVA (15%):', 140, y);
  doc.text(formatCurrency(iva), 196, y, { align: 'right' });

  y += 4;
  doc.line(140, y, 196, y);

  y += 7;
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', 140, y);
  doc.text(formatCurrency(total), 196, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');

  y += 20;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Gracias por su compra. Este documento es generado por Stockly.', 105, y, { align: 'center' });

  doc.save(`factura_${numeroFactura}.pdf`);
}

export function exportFacturaExcel(
  items: FacturaItem[],
  cliente: string,
  numeroFactura: string,
  perfilNombre: string
) {
  const subtotal = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
  const iva = subtotal * 0.15;
  const total = subtotal + iva;

  const data = [
    { Campo: 'Factura', Valor: numeroFactura },
    { Campo: 'Cliente', Valor: cliente },
    { Campo: 'Vendedor', Valor: perfilNombre },
    { Campo: 'Fecha', Valor: new Date().toLocaleDateString('es-ES') },
    {},
    { Campo: 'Producto', Valor: 'Cantidad', },
  ];

  const ws = XLSX.utils.json_to_sheet([]);
  XLSX.utils.sheet_add_json(ws, data, { origin: 'A1' });

  const detalleHeader = ['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal'];
  XLSX.utils.sheet_add_json(ws, [{ Producto: 'Producto', Cantidad: 'Cantidad', 'Precio Unitario': 'Precio Unitario', Subtotal: 'Subtotal' }], { origin: 'A7', skipHeader: true });

  const detalleRows = items.map((item) => ({
    Producto: item.producto.nombre,
    Cantidad: item.cantidad,
    'Precio Unitario': item.precio,
    Subtotal: item.precio * item.cantidad,
  }));
  XLSX.utils.sheet_add_json(ws, detalleRows, { origin: 'A8', skipHeader: true });

  const startTotals = 8 + detalleRows.length + 1;
  XLSX.utils.sheet_add_json(ws, [
    { Producto: 'Subtotal', Subtotal: subtotal },
    { Producto: 'IVA (15%)', Subtotal: iva },
    { Producto: 'Total', Subtotal: total },
  ], { origin: `A${startTotals}`, skipHeader: true });

  ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 18 }, { wch: 18 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Factura');
  XLSX.writeFile(wb, `factura_${numeroFactura}.xlsx`);
}

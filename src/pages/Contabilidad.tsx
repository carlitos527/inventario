import { useEffect, useState } from 'react';
import { supabase, type AsientoContable, type Factura } from '@/lib/supabase';
import { formatCurrency, formatDate, isToday } from '@/lib/utils';
import { Calculator, TrendingUp, TrendingDown, FileText, Loader2, Receipt } from 'lucide-react';

export default function Contabilidad() {
  const [asientos, setAsientos] = useState<AsientoContable[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: as }, { data: f }] = await Promise.all([
        supabase.from('asientos_contables').select('*').order('fecha', { ascending: false }).limit(100),
        supabase.from('facturas').select('*').order('creado_en', { ascending: false }).limit(50),
      ]);
      setAsientos((as as AsientoContable[]) || []);
      setFacturas((f as Factura[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  const ingresos = asientos.filter((a) => a.cuenta_codigo === '4100').reduce((s, a) => s + Number(a.credito), 0);
  const egresos = asientos.filter((a) => a.cuenta_codigo.startsWith('5')).reduce((s, a) => s + Number(a.debito), 0);
  const utilidad = ingresos - egresos;
  const ivaPendiente = asientos.filter((a) => a.cuenta_codigo === '2100').reduce((s, a) => s + Number(a.credito) - Number(a.debito), 0);
  const facturasHoy = facturas.filter((f) => isToday(f.creado_en));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Contabilidad</h1>
        <p className="text-slate-400 text-sm mt-0.5">Resumen financiero y asientos contables</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(ingresos)}</p>
          <p className="text-xs text-slate-400 mt-0.5">Ingresos</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center mb-2">
            <TrendingDown className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(egresos)}</p>
          <p className="text-xs text-slate-400 mt-0.5">Egresos</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center mb-2">
            <Calculator className="w-5 h-5 text-sky-500" />
          </div>
          <p className={`text-2xl font-bold ${utilidad >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(utilidad)}</p>
          <p className="text-xs text-slate-400 mt-0.5">Utilidad</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-2">
            <Receipt className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(ivaPendiente)}</p>
          <p className="text-xs text-slate-400 mt-0.5">IVA por pagar</p>
        </div>
      </div>

      {/* Facturas */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
          <FileText className="w-5 h-5 text-sky-500" />
          <h2 className="font-bold text-slate-800">Facturas emitidas</h2>
          <span className="ml-auto text-sm text-slate-400">{facturasHoy.length} hoy</span>
        </div>
        {facturas.length === 0 ? (
          <p className="px-6 py-8 text-center text-slate-400 text-sm">No hay facturas</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {facturas.map((f) => (
              <div key={f.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-700 text-sm">{f.numero} · {f.cliente_nombre}</p>
                  <p className="text-xs text-slate-400">{formatDate(f.creado_en)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-600 text-sm">{formatCurrency(Number(f.total))}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    f.estado === 'pagada' ? 'bg-emerald-50 text-emerald-600' :
                    f.estado === 'anulada' ? 'bg-rose-50 text-rose-600' : 'bg-sky-50 text-sky-600'
                  }`}>{f.estado}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Asientos */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-emerald-500" />
          <h2 className="font-bold text-slate-800">Asientos contables</h2>
        </div>
        {asientos.length === 0 ? (
          <p className="px-6 py-8 text-center text-slate-400 text-sm">No hay asientos contables</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {asientos.map((a) => (
              <div key={a.id} className="px-6 py-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-700 text-sm truncate">{a.descripcion}</p>
                  <p className="text-xs text-slate-400">{a.cuenta_codigo} · {a.cuenta_nombre} · {formatDate(a.fecha)}</p>
                </div>
                <div className="flex gap-4 text-sm">
                  {Number(a.debito) > 0 && <span className="font-semibold text-slate-600">D: {formatCurrency(Number(a.debito))}</span>}
                  {Number(a.credito) > 0 && <span className="font-semibold text-slate-600">C: {formatCurrency(Number(a.credito))}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

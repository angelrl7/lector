import { useEffect, useMemo, useState } from 'react';
import { fetchRecentScans } from '../lib/products';
import { formatPrice, timeAgo } from '../lib/format';
import { useToast } from './Toast';

export default function ActivityPage({ onEdit }) {
  const toast = useToast();
  const [scans, setScans] = useState(null);

  useEffect(() => {
    fetchRecentScans(100).then(setScans).catch((err) => {
      setScans([]);
      toast('Error: ' + err.message, 'error');
    });
  }, [toast]);

  const stats = useMemo(() => {
    if (!scans) return null;
    const today = new Date().toDateString();
    const todays = scans.filter((s) => new Date(s.scanned_at).toDateString() === today);
    // Los escaneos vienen del más nuevo al más viejo: cuenta el último resultado de cada código
    const latest = new Map();
    for (const s of scans) if (!latest.has(s.code)) latest.set(s.code, s.found);
    const missing = [...latest].filter(([, found]) => !found).map(([code]) => code);
    return { today: todays.length, found: todays.filter((s) => s.found).length, missing };
  }, [scans]);

  if (!scans) return <div className="card"><div className="spinner" /></div>;

  return (
    <section>
      <div className="stats">
        <div className="card stat"><b>{stats.today}</b><span>escaneos hoy</span></div>
        <div className="card stat"><b>{stats.found}</b><span>encontrados hoy</span></div>
        <div className="card stat"><b>{stats.missing.length}</b><span>códigos sin cargar</span></div>
      </div>

      {stats.missing.length > 0 && (
        <div className="card">
          <h3>Códigos escaneados sin producto</h3>
          <ul className="list">
            {stats.missing.map((code) => (
              <li key={code} onClick={() => onEdit({ code })}>
                <span className="p-code">{code}</span>
                <span className="link-text">+ Agregar</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h3>Últimos escaneos</h3>
        {scans.length === 0 ? (
          <p className="muted">Todavía no hay escaneos.</p>
        ) : (
          <ul className="list">
            {scans.map((s) => (
              <li key={s.id} onClick={s.product ? undefined : () => onEdit({ code: s.code })}
                style={s.product ? { cursor: 'default' } : undefined}>
                <div>
                  <div className="p-name">{s.product?.name ?? 'No encontrado'}</div>
                  <div className="p-code">{s.code} · {timeAgo(s.scanned_at)}</div>
                </div>
                <div className={s.product ? 'p-price' : 'p-missing'}>
                  {s.product ? formatPrice(s.product.price) : '—'}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

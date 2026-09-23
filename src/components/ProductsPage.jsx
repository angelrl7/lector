import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { fetchAllProducts, searchProducts, upsertProducts } from '../lib/products';
import { downloadFile, parseProductsCSV, toCSV } from '../lib/csv';
import { formatPrice } from '../lib/format';
import { useToast } from './Toast';

const LIMIT = 100;

export default function ProductsPage({ onEdit }) {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const fileRef = useRef();

  // Búsqueda con debounce
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const data = await searchProducts(query, LIMIT);
        if (!cancelled) setProducts(data);
      } catch (err) {
        if (!cancelled) toast('Error: ' + err.message, 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query, reloadKey, toast]);

  // Tiempo real: si otro celular cambia un producto, se refresca la lista
  useEffect(() => {
    const channel = supabase
      .channel('products-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' },
        () => setReloadKey((k) => k + 1))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const importCSV = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const { rows, skipped } = parseProductsCSV(await file.text());
    if (!rows.length) { toast('El archivo no tiene productos válidos', 'error'); return; }
    if (!confirm(`Se van a importar ${rows.length} productos (los códigos que ya existen se actualizan). ¿Continuar?`)) return;
    try {
      await upsertProducts(rows, (done, total) => setBusy(`Importando ${done}/${total}…`));
      toast(`${rows.length} productos importados${skipped ? `, ${skipped} filas salteadas` : ''}`, 'ok');
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast('Error al importar: ' + err.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  const exportCSV = async () => {
    setBusy('Exportando…');
    try {
      const all = await fetchAllProducts();
      downloadFile(`productos-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(all));
    } catch (err) {
      toast('Error al exportar: ' + err.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section>
      <div className="card">
        <button className="big" onClick={() => onEdit(null)}>+ Nuevo producto</button>
        <label htmlFor="search">Buscar</label>
        <input id="search" type="search" placeholder="Nombre, código o categoría"
          value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="card">
        {loading ? (
          <div className="spinner" />
        ) : products.length === 0 ? (
          <p className="muted">{query ? 'Sin resultados.' : 'No hay productos cargados.'}</p>
        ) : (
          <ul className="list">
            {products.map((p) => (
              <li key={p.id} onClick={() => onEdit(p)}>
                <div>
                  <div className="p-name">{p.name}</div>
                  <div className="p-code">{p.code}{p.category ? ` · ${p.category}` : ''}</div>
                </div>
                <div className="p-price">{formatPrice(p.price)}</div>
              </li>
            ))}
          </ul>
        )}
        {products.length === LIMIT && (
          <p className="muted">Mostrando los primeros {LIMIT}. Usá el buscador para filtrar.</p>
        )}
      </div>

      <div className="card">
        <p className="muted" style={{ marginTop: 0 }}>
          CSV con columnas <b>codigo,nombre,precio</b> y, si querés, <b>categoria,stock</b>.
        </p>
        <div className="row">
          <button className="secondary" disabled={!!busy} onClick={() => fileRef.current.click()}>Importar CSV</button>
          <button className="secondary" disabled={!!busy} onClick={exportCSV}>Exportar CSV</button>
        </div>
        {busy && <p className="muted">{busy}</p>}
        <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={importCSV} />
      </div>
    </section>
  );
}

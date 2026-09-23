import { useEffect, useState } from 'react';
import Scanner from './Scanner';
import { deleteProduct, fetchPriceHistory, findByCode, saveProduct } from '../lib/products';
import { parsePrice } from '../lib/csv';
import { formatDate, formatPrice } from '../lib/format';
import { useToast } from './Toast';

/** `initial` puede ser null (nuevo), { code } (nuevo con código) o un producto existente. */
export default function ProductForm({ initial, onClose }) {
  const toast = useToast();
  const existing = initial?.id ? initial : null;
  const [form, setForm] = useState({
    code: initial?.code ?? '',
    name: existing?.name ?? '',
    price: existing?.price?.toString() ?? '',
    category: existing?.category ?? '',
    stock: existing?.stock?.toString() ?? '0',
  });
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (existing) fetchPriceHistory(existing.id).then(setHistory).catch(() => {});
  }, [existing]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const newPrice = parsePrice(form.price);
  const change = existing && !isNaN(newPrice) && Number(existing.price) > 0 && newPrice !== Number(existing.price)
    ? ((newPrice - existing.price) / existing.price) * 100
    : null;

  const submit = async (e) => {
    e.preventDefault();
    const code = form.code.trim();
    const name = form.name.trim();
    if (!code || !name || isNaN(newPrice) || newPrice < 0) {
      toast('Completá código, nombre y un precio válido', 'error');
      return;
    }
    setSaving(true);
    try {
      if (!existing || code !== existing.code) {
        const dup = await findByCode(code);
        if (dup) {
          toast(`El código ya pertenece a "${dup.name}"`, 'error');
          return;
        }
      }
      const saved = await saveProduct({
        code,
        name,
        price: newPrice,
        category: form.category.trim() || null,
        stock: parseInt(form.stock, 10) || 0,
      }, existing?.id);
      toast('Guardado', 'ok');
      onClose(saved);
    } catch (err) {
      toast('Error al guardar: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm(`¿Eliminar "${existing.name}"?`)) return;
    try {
      await deleteProduct(existing.id);
      toast('Eliminado', 'ok');
      onClose(null);
    } catch (err) {
      toast('Error al eliminar: ' + err.message, 'error');
    }
  };

  return (
    <section>
      <form className="card" onSubmit={submit}>
        <h2>{existing ? 'Editar producto' : 'Nuevo producto'}</h2>

        <label htmlFor="f-code">Código</label>
        <div className="row">
          <input id="f-code" inputMode="numeric" value={form.code} onChange={set('code')} autoFocus={!initial?.code} />
          <button type="button" className="secondary shrink" onClick={() => setScanning(!scanning)}>
            {scanning ? '✕' : '📷'}
          </button>
        </div>
        {scanning && (
          <Scanner onDetect={(code) => { setForm((f) => ({ ...f, code })); setScanning(false); }} />
        )}

        <label htmlFor="f-name">Nombre</label>
        <input id="f-name" value={form.name} onChange={set('name')} autoFocus={Boolean(initial?.code && !existing)} />

        <div className="row">
          <div>
            <label htmlFor="f-price">Precio</label>
            <input id="f-price" inputMode="decimal" value={form.price} onChange={set('price')} placeholder="0,00" />
          </div>
          <div>
            <label htmlFor="f-stock">Stock</label>
            <input id="f-stock" type="number" inputMode="numeric" value={form.stock} onChange={set('stock')} />
          </div>
        </div>
        {change !== null && (
          <p className={change > 0 ? 'danger-text' : 'ok'}>
            {change > 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}% respecto de {formatPrice(existing.price)}
          </p>
        )}

        <label htmlFor="f-category">Categoría</label>
        <input id="f-category" value={form.category} onChange={set('category')} placeholder="Ej: Bebidas" />

        <div className="row" style={{ marginTop: 18 }}>
          <button type="button" className="secondary" onClick={() => onClose(undefined)}>Cancelar</button>
          <button disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
        </div>
        {existing && (
          <button type="button" className="big danger" style={{ marginTop: 10 }} onClick={remove}>Eliminar</button>
        )}
      </form>

      {history.length > 0 && (
        <div className="card">
          <h3>Historial de precios</h3>
          <ul className="list compact">
            {history.map((h) => (
              <li key={h.id}>
                <span className="p-code">{formatDate(h.changed_at)}</span>
                <span>
                  {h.old_price != null && <span className="muted strike">{formatPrice(h.old_price)}</span>}{' '}
                  <b>{formatPrice(h.new_price)}</b>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

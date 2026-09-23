import { useEffect, useState } from 'react';
import Scanner from './Scanner';
import { findByCode, logScan } from '../lib/products';
import { beep } from '../lib/feedback';
import { formatPrice, timeAgo } from '../lib/format';
import { useToast } from './Toast';

const STALE_DAYS = 30;

export default function ScanPage({ active, onEdit }) {
  const toast = useToast();
  const [scanning, setScanning] = useState(false);
  const [continuous, setContinuous] = useState(false);
  const [result, setResult] = useState(null); // { code, product, loading }
  const [recent, setRecent] = useState([]);
  const [manual, setManual] = useState('');

  // Apaga la cámara al cambiar de pestaña
  useEffect(() => {
    if (!active) setScanning(false);
  }, [active]);

  // Abre el formulario y, al volver, refresca el resultado en pantalla
  const edit = (product) => {
    setScanning(false);
    onEdit(product, (saved) => {
      if (saved === undefined) return; // cancelado
      const code = saved?.code ?? product.code;
      setResult(saved ? { code, product: saved, loading: false } : null);
      setRecent((r) => r.map((x) => (x.code === code ? { ...x, product: saved } : x)));
    });
  };

  const lookup = async (code) => {
    if (!continuous) setScanning(false);
    setResult({ code, product: null, loading: true });
    try {
      const product = await findByCode(code);
      beep(Boolean(product));
      setResult({ code, product, loading: false });
      setRecent((r) => [{ code, product }, ...r.filter((x) => x.code !== code)].slice(0, 10));
      logScan(code, product).catch(() => {});
    } catch (err) {
      setResult(null);
      toast('Error al buscar: ' + err.message, 'error');
    }
  };

  const submitManual = (e) => {
    e.preventDefault();
    const code = manual.trim();
    if (code) {
      lookup(code);
      setManual('');
    }
  };

  return (
    <section>
      <div className="card">
        {scanning && <Scanner onDetect={lookup} continuous={continuous} />}
        <button className={`big ${scanning ? 'secondary' : ''}`} onClick={() => setScanning(!scanning)}>
          {scanning ? 'Detener cámara' : '📷 Escanear código'}
        </button>
        <label className="switch">
          <input type="checkbox" checked={continuous} disabled={scanning}
            onChange={(e) => setContinuous(e.target.checked)} />
          Modo continuo (seguir escaneando sin cerrar la cámara)
        </label>
      </div>

      {result && (
        <Result result={result} scanning={scanning} onEdit={edit} onAgain={() => setScanning(true)} />
      )}

      <form className="card" onSubmit={submitManual}>
        <label htmlFor="manual">O ingresá el código a mano</label>
        <div className="row">
          <input id="manual" inputMode="numeric" placeholder="Ej: 7790001234567"
            value={manual} onChange={(e) => setManual(e.target.value)} />
          <button className="shrink">Buscar</button>
        </div>
      </form>

      {recent.length > 0 && (
        <div className="card">
          <h3>Escaneados recién</h3>
          <ul className="list">
            {recent.map((r) => (
              <li key={r.code} onClick={() => lookup(r.code)}>
                <div>
                  <div className="p-name">{r.product?.name ?? 'No encontrado'}</div>
                  <div className="p-code">{r.code}</div>
                </div>
                <div className={r.product ? 'p-price' : 'p-missing'}>
                  {r.product ? formatPrice(r.product.price) : '—'}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Result({ result, scanning, onEdit, onAgain }) {
  const { code, product, loading } = result;

  if (loading) {
    return <div className="card result"><div className="spinner" /></div>;
  }

  if (!product) {
    return (
      <div className="card result notfound">
        <div className="price">Producto no encontrado</div>
        <div className="code">Código: {code}</div>
        <div className="row" style={{ marginTop: 14 }}>
          <button onClick={() => onEdit({ code })}>+ Agregar producto</button>
          {!scanning && <button className="secondary" onClick={onAgain}>Escanear otro</button>}
        </div>
      </div>
    );
  }

  const stale = Date.now() - new Date(product.updated_at).getTime() > STALE_DAYS * 864e5;

  return (
    <div className="card result">
      {product.category && <div className="badge">{product.category}</div>}
      <div className="name">{product.name}</div>
      <div className="price">{formatPrice(product.price)}</div>
      <div className="code">Código: {code}</div>
      <div className="meta">
        <span>Stock: <b className={product.stock <= 0 ? 'danger-text' : ''}>{product.stock}</b></span>
        <span>Actualizado {timeAgo(product.updated_at)}</span>
      </div>
      {stale && <p className="warn">⚠️ Este precio no se actualiza hace más de {STALE_DAYS} días.</p>}
      <div className="row" style={{ marginTop: 14 }}>
        <button className="secondary" onClick={() => onEdit(product)}>Editar</button>
        {!scanning && <button onClick={onAgain}>Escanear otro</button>}
      </div>
    </div>
  );
}

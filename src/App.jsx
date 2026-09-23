import { useEffect, useRef, useState } from 'react';
import { isConfigured, supabase } from './lib/supabase';
import Auth from './components/Auth';
import ScanPage from './components/ScanPage';
import ProductsPage from './components/ProductsPage';
import ProductForm from './components/ProductForm';
import ActivityPage from './components/ActivityPage';

const TABS = [
  { id: 'scan', label: 'Escanear', icon: '📷' },
  { id: 'products', label: 'Productos', icon: '📦' },
  { id: 'activity', label: 'Actividad', icon: '📊' },
];

export default function App() {
  const [session, setSession] = useState(undefined);
  const [tab, setTab] = useState('scan');
  const [editing, setEditing] = useState(undefined); // undefined = sin formulario abierto
  const onFormClose = useRef(null);

  useEffect(() => {
    if (!isConfigured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!isConfigured) return <SetupMissing />;
  if (session === undefined) return <div className="center"><div className="spinner" /></div>;
  if (!session) return <Auth />;

  const openForm = (product, onClose) => {
    onFormClose.current = onClose ?? null;
    setEditing(product);
    window.scrollTo(0, 0);
  };

  const closeForm = (saved) => {
    onFormClose.current?.(saved);
    onFormClose.current = null;
    setEditing(undefined);
  };

  return (
    <>
      <header>
        <span>🏷️ Lector de Precios</span>
        <button className="link light" onClick={() => supabase.auth.signOut()} title={session.user.email}>
          Salir
        </button>
      </header>

      <main>
        {editing !== undefined && <ProductForm initial={editing} onClose={closeForm} />}

        <div hidden={editing !== undefined}>
          {/* La pestaña de escaneo queda montada para no perder el último resultado */}
          <div hidden={tab !== 'scan'}>
            <ScanPage active={tab === 'scan' && editing === undefined} onEdit={openForm} />
          </div>
          {tab === 'products' && <ProductsPage onEdit={openForm} />}
          {tab === 'activity' && <ActivityPage onEdit={openForm} />}
        </div>
      </main>

      <nav>
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id && editing === undefined ? 'active' : ''}
            onClick={() => { closeForm(undefined); setTab(t.id); }}>
            <span className="nav-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </>
  );
}

function SetupMissing() {
  return (
    <div className="auth">
      <div className="card">
        <h2>Falta configurar Supabase</h2>
        <p>
          Creá un archivo <code>.env</code> en la carpeta del proyecto (podés copiar{' '}
          <code>.env.example</code>) con <code>VITE_SUPABASE_URL</code> y{' '}
          <code>VITE_SUPABASE_ANON_KEY</code>, y reiniciá <code>npm run dev</code>.
        </p>
      </div>
    </div>
  );
}

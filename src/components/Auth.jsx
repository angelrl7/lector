import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { data, error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) setMessage({ type: 'error', text: translate(error.message) });
    else if (mode === 'signup' && !data.session)
      setMessage({ type: 'ok', text: 'Te enviamos un mail para confirmar la cuenta.' });
  };

  return (
    <div className="auth">
      <div className="auth-logo">🏷️</div>
      <h1>Lector de Precios</h1>
      <form className="card" onSubmit={submit}>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" required
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="password">Contraseña</label>
        <input id="password" type="password" minLength={6} required
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          value={password} onChange={(e) => setPassword(e.target.value)} />
        {message && <p className={message.type}>{message.text}</p>}
        <button className="big" disabled={loading} style={{ marginTop: 16 }}>
          {loading ? 'Cargando…' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
        </button>
        <button type="button" className="link" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          {mode === 'login' ? '¿No tenés cuenta? Registrate' : 'Ya tengo cuenta'}
        </button>
      </form>
    </div>
  );
}

function translate(msg) {
  if (/invalid login/i.test(msg)) return 'Email o contraseña incorrectos.';
  if (/already registered/i.test(msg)) return 'Ese email ya está registrado.';
  if (/email not confirmed/i.test(msg)) return 'Todavía no confirmaste tu email.';
  return msg;
}

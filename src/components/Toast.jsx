import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null);
  const timer = useRef();

  const show = useCallback((text, type = 'info') => {
    setMsg({ text, type });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2500);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className={`toast ${msg ? 'show' : ''} ${msg?.type ?? ''}`}>{msg?.text}</div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

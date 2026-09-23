import { createRoot } from 'react-dom/client';
import App from './App';
import { ToastProvider } from './components/Toast';
import './styles.css';

// Sin StrictMode: el doble montaje en desarrollo abre y cierra la cámara dos veces
createRoot(document.getElementById('root')).render(
  <ToastProvider>
    <App />
  </ToastProvider>,
);

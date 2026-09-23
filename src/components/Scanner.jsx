import { useEffect, useId, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats as F } from 'html5-qrcode';

const FORMATS = [F.EAN_13, F.EAN_8, F.UPC_A, F.UPC_E, F.CODE_128, F.CODE_39, F.ITF, F.QR_CODE];

/**
 * Muestra la cámara trasera y llama a onDetect(codigo) con cada lectura.
 * En modo continuo ignora el mismo código durante `cooldown` ms.
 */
export default function Scanner({ onDetect, continuous = false, cooldown = 2000 }) {
  const elementId = 'scanner-' + useId().replace(/:/g, '');
  const onDetectRef = useRef(onDetect);
  onDetectRef.current = onDetect;
  const scannerRef = useRef(null);
  const [error, setError] = useState(null);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  useEffect(() => {
    const scanner = new Html5Qrcode(elementId, { formatsToSupport: FORMATS, verbose: false });
    scannerRef.current = scanner;
    let done = false;
    let last = { code: null, at: 0 };

    const onSuccess = (text) => {
      const code = text.trim();
      const now = Date.now();
      if (done) return;
      if (code === last.code && now - last.at < cooldown) return;
      last = { code, at: now };
      if (!continuous) done = true;
      onDetectRef.current(code);
    };

    const started = scanner
      .start(
        { facingMode: 'environment' },
        {
          fps: 12,
          qrbox: (w, h) => ({ width: Math.floor(w * 0.85), height: Math.floor(Math.min(w, h) * 0.45) }),
        },
        onSuccess,
        () => {},
      )
      .then(() => {
        try {
          setTorchAvailable(Boolean(scanner.getRunningTrackCapabilities()?.torch));
        } catch {
          // el navegador no informa capacidades
        }
      })
      .catch((err) => setError(String(err)));

    return () => {
      done = true;
      started
        .then(() => (scanner.isScanning ? scanner.stop() : null))
        .then(() => scanner.clear())
        .catch(() => {});
    };
  }, [elementId, continuous, cooldown]);

  const toggleTorch = async () => {
    try {
      await scannerRef.current.applyVideoConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn(!torchOn);
    } catch {
      setTorchAvailable(false);
    }
  };

  return (
    <div className="scanner">
      <div id={elementId} className="scanner-video" />
      {torchAvailable && (
        <button type="button" className="torch" onClick={toggleTorch} aria-label="Linterna">
          {torchOn ? '🔦 Apagar' : '🔦 Linterna'}
        </button>
      )}
      {error && (
        <p className="error">
          No se pudo abrir la cámara. Revisá los permisos del navegador y que la página esté
          abierta con https://.
          <br />
          <small>{error}</small>
        </p>
      )}
    </div>
  );
}

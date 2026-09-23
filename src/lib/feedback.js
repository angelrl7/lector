let ctx;

// Pitido corto + vibración al leer un código
export function beep(ok = true) {
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.frequency.value = ok ? 1200 : 400;
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (ok ? 0.12 : 0.3));
  } catch {
    // sin audio disponible
  }
  navigator.vibrate?.(ok ? 100 : [80, 60, 80]);
}

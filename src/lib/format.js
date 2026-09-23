const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
const dateTime = new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' });

export const formatPrice = (n) => money.format(Number(n));
export const formatDate = (d) => dateTime.format(new Date(d));

export function timeAgo(d) {
  const secs = Math.round((Date.now() - new Date(d).getTime()) / 1000);
  if (secs < 60) return 'recién';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  return formatDate(d);
}

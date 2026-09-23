function parseLine(line, sep) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

// Acepta "1.234,56", "1234,56" y "1234.56"
export function parsePrice(s) {
  s = String(s ?? '').replace(/[^\d.,-]/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  return parseFloat(s);
}

/**
 * Lee un CSV con columnas codigo,nombre,precio[,categoria][,stock].
 * Separador "," o ";". Las filas inválidas (incluido el encabezado) se saltean.
 */
export function parseProductsCSV(text) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  const sep = (lines[0] || '').includes(';') ? ';' : ',';
  const byCode = new Map();
  let skipped = 0;
  for (const line of lines) {
    const [code, name, priceStr, category, stockStr] = parseLine(line, sep);
    const price = parsePrice(priceStr);
    if (!code || !name || isNaN(price)) { skipped++; continue; }
    const row = { code, name, price };
    if (category) row.category = category;
    const stock = parseInt(stockStr, 10);
    if (!isNaN(stock)) row.stock = stock;
    byCode.set(code, row); // si el código se repite, gana la última fila
  }
  return { rows: [...byCode.values()], skipped };
}

export function toCSV(products) {
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = ['codigo,nombre,precio,categoria,stock'];
  for (const p of products) {
    lines.push([p.code, p.name, p.price, p.category, p.stock].map(esc).join(','));
  }
  return lines.join('\n');
}

export function downloadFile(filename, content, type = 'text/csv') {
  const blob = new Blob(['﻿' + content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

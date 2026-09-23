import { supabase } from './supabase';

const PAGE = 1000;

export async function findByCode(code) {
  const { data, error } = await supabase.from('products').select('*').eq('code', code).maybeSingle();
  if (error) throw error;
  return data;
}

export async function searchProducts(query, limit = 100) {
  let req = supabase.from('products').select('*').order('name').limit(limit);
  const q = query.trim().replace(/[%,()]/g, ' ');
  if (q) req = req.or(`name.ilike.%${q}%,code.ilike.%${q}%,category.ilike.%${q}%`);
  const { data, error } = await req;
  if (error) throw error;
  return data;
}

export async function fetchAllProducts() {
  const all = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('products').select('*').order('name').range(from, from + PAGE - 1);
    if (error) throw error;
    all.push(...data);
    if (data.length < PAGE) return all;
  }
}

export async function saveProduct(product, id) {
  const req = id
    ? supabase.from('products').update(product).eq('id', id)
    : supabase.from('products').insert(product);
  const { data, error } = await req.select().single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertProducts(rows, onProgress) {
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await supabase
      .from('products').upsert(rows.slice(i, i + CHUNK), { onConflict: 'code' });
    if (error) throw error;
    onProgress?.(Math.min(i + CHUNK, rows.length), rows.length);
  }
}

export async function fetchPriceHistory(productId) {
  const { data, error } = await supabase
    .from('price_history').select('*').eq('product_id', productId)
    .order('changed_at', { ascending: false }).limit(30);
  if (error) throw error;
  return data;
}

export async function logScan(code, product) {
  // user_id lo completa la base con auth.uid()
  const { error } = await supabase.from('scans').insert({
    code, product_id: product?.id ?? null, found: Boolean(product),
  });
  if (error) throw error;
}

export async function fetchRecentScans(limit = 50) {
  const { data, error } = await supabase
    .from('scans').select('*, product:products(id, name, price)')
    .order('scanned_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return data;
}

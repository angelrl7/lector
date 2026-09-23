-- Esquema de Lector de Precios
-- Ejecutar en Supabase > SQL Editor (una sola vez)

-- ============ Productos ============
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  price       numeric(12, 2) not null check (price >= 0),
  category    text,
  stock       integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) default auth.uid()
);

create index if not exists products_name_idx on public.products using gin (to_tsvector('spanish', name));

-- ============ Historial de precios ============
create table if not exists public.price_history (
  id          bigint generated always as identity primary key,
  product_id  uuid not null references public.products (id) on delete cascade,
  old_price   numeric(12, 2),
  new_price   numeric(12, 2) not null,
  changed_at  timestamptz not null default now(),
  changed_by  uuid references auth.users (id)
);

create index if not exists price_history_product_idx on public.price_history (product_id, changed_at desc);

-- ============ Registro de escaneos ============
create table if not exists public.scans (
  id          bigint generated always as identity primary key,
  code        text not null,
  product_id  uuid references public.products (id) on delete set null,
  found       boolean not null,
  scanned_at  timestamptz not null default now(),
  user_id     uuid references auth.users (id) default auth.uid()
);

create index if not exists scans_scanned_at_idx on public.scans (scanned_at desc);

-- ============ Triggers ============
create or replace function public.products_before_update()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;

drop trigger if exists products_before_update on public.products;
create trigger products_before_update
  before update on public.products
  for each row execute function public.products_before_update();

-- Guarda cada cambio de precio (y el precio inicial) en price_history
create or replace function public.log_price_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.price is distinct from old.price then
    insert into public.price_history (product_id, old_price, new_price, changed_by)
    values (new.id, case when tg_op = 'UPDATE' then old.price end, new.price, auth.uid());
  end if;
  return new;
end $$;

drop trigger if exists products_price_log on public.products;
create trigger products_price_log
  after insert or update of price on public.products
  for each row execute function public.log_price_change();

-- ============ Seguridad (RLS) ============
-- Todos los usuarios logueados comparten la misma lista de productos.
alter table public.products      enable row level security;
alter table public.price_history enable row level security;
alter table public.scans         enable row level security;

drop policy if exists "products read"   on public.products;
drop policy if exists "products insert" on public.products;
drop policy if exists "products update" on public.products;
drop policy if exists "products delete" on public.products;
create policy "products read"   on public.products for select to authenticated using (true);
create policy "products insert" on public.products for insert to authenticated with check (true);
create policy "products update" on public.products for update to authenticated using (true) with check (true);
create policy "products delete" on public.products for delete to authenticated using (true);

drop policy if exists "history read" on public.price_history;
create policy "history read" on public.price_history for select to authenticated using (true);

drop policy if exists "scans read"   on public.scans;
drop policy if exists "scans insert" on public.scans;
create policy "scans read"   on public.scans for select to authenticated using (true);
create policy "scans insert" on public.scans for insert to authenticated with check (user_id = auth.uid());

-- ============ Tiempo real ============
-- Los cambios de precio aparecen al instante en todos los celulares.
do $$
begin
  alter publication supabase_realtime add table public.products;
exception when duplicate_object then null;
end $$;

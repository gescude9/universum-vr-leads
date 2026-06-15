-- ============================================================
--  Universum VR — Esquema de base de datos (Supabase / Postgres)
--  Ejecuta TODO esto en el SQL Editor de tu proyecto Supabase.
-- ============================================================

-- ---------- Tablas ----------
create table if not exists public.vendedores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text,
  email text,
  created_at timestamptz default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text,
  contacto text,
  fecha date,
  hora text,
  personas int default 5,
  paquete text default 'Gaming',
  premium text,
  vendedor uuid references public.vendedores(id) on delete set null,
  estado text default 'Nuevo',
  monto_estimado numeric default 0,
  monto_cerrado numeric default 0,
  comision numeric default 0,
  notas text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Mantener updated_at al día automáticamente
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_leads_updated on public.leads;
create trigger trg_leads_updated before update on public.leads
  for each row execute function public.set_updated_at();

-- ---------- Row Level Security ----------
alter table public.vendedores enable row level security;
alter table public.leads      enable row level security;

-- Solo usuarios con sesión iniciada (tu equipo) pueden leer/escribir.
drop policy if exists "equipo vendedores" on public.vendedores;
create policy "equipo vendedores" on public.vendedores
  for all to authenticated using (true) with check (true);

drop policy if exists "equipo leads" on public.leads;
create policy "equipo leads" on public.leads
  for all to authenticated using (true) with check (true);

-- ---------- Exponer las tablas a la Data API ----------
-- (Necesario en proyectos nuevos de Supabase, donde las tablas ya no se
--  exponen automáticamente. También puedes activar "expose new tables"
--  en Settings -> Data API.)
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.vendedores to authenticated;
grant select, insert, update, delete on public.leads to authenticated;

-- ---------- Vendedores iniciales ----------
insert into public.vendedores (nombre) values
  ('GERARDO ESCUDERO'),
  ('BETTINA CAPUCHO'),
  ('REYNALDO'),
  ('ASTRO MARKETING MEDIA'),
  ('STAFF')
on conflict do nothing;

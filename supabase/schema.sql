-- Home Market - Supabase Schema
-- Run this in your Supabase SQL Editor

-- Products table
create table public.products (
  id        bigint generated always as identity primary key,
  user_id   uuid   references auth.users (id) on delete cascade not null,
  name      text   not null,
  unit      text   not null default 'un',
  category  text   not null default 'Outros',
  created_at timestamptz default now() not null
);

-- Feiras (shopping trips) table
create table public.feiras (
  id        bigint generated always as identity primary key,
  user_id   uuid   references auth.users (id) on delete cascade not null,
  name      text   not null,
  store     text   not null,
  date      date   not null,
  notes     text,
  created_at timestamptz default now() not null
);

-- Feira items (products bought in each trip)
create table public.feira_items (
  id         bigint          generated always as identity primary key,
  feira_id   bigint          references public.feiras   (id) on delete cascade  not null,
  product_id bigint          references public.products (id) on delete restrict  not null,
  quantity   numeric(12, 3)  not null check (quantity > 0),
  unit_price numeric(12, 2)  not null check (unit_price > 0),
  created_at timestamptz     default now() not null
);

-- Indexes for common queries
create index on public.feiras      (user_id, date desc);
create index on public.feira_items (feira_id);
create index on public.products    (user_id, name);

-- Grant schema + table access to authenticated users
-- (required when tables are created via SQL instead of the dashboard)
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.products    to authenticated;
grant select, insert, update, delete on public.feiras      to authenticated;
grant select, insert, update, delete on public.feira_items to authenticated;

grant usage, select on all sequences in schema public to authenticated;

-- Row Level Security (restricts rows to the owner even with grants above)
alter table public.products    enable row level security;
alter table public.feiras      enable row level security;
alter table public.feira_items enable row level security;

-- Products: full CRUD for owner
create policy "products: owner full access"
  on public.products for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Feiras: full CRUD for owner
create policy "feiras: owner full access"
  on public.feiras for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Feira items: access through the parent feira
create policy "feira_items: owner full access"
  on public.feira_items for all
  using (
    exists (
      select 1 from public.feiras
      where feiras.id = feira_items.feira_id
        and feiras.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.feiras
      where feiras.id = feira_items.feira_id
        and feiras.user_id = auth.uid()
    )
  );

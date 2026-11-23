-- Migration: Create subcategories and add subcategory_id and size_label to services

-- 1. Create subcategories table
create table if not exists subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (category_id, name)
);

-- 2. Alter services table
alter table services
  add column if not exists subcategory_id uuid null references subcategories(id) on delete set null,
  add column if not exists size_label text null;

-- 3. Enable RLS and add Owner policy
alter table subcategories enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'subcategories' and policyname = 'Owner access subcategories'
  ) then
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
      execute 'create policy "Owner access subcategories" on subcategories for all to authenticated using (true) with check (true)';
    else
      execute 'create policy "Owner access subcategories" on subcategories for all using (true) with check (true)';
    end if;
  end if;
end;
$$;

-- 4. Create index for fast lookups by subcategory
create index if not exists idx_services_subcategory_id on services(subcategory_id);
create index if not exists idx_subcategories_category_id on subcategories(category_id);

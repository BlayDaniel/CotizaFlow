-- Fase 10T - Hardening Edge Function administrativa y soporte móvil
-- Incremental. No elimina datos operativos.

create or replace function public.platform_superuser_email()
returns text
language sql
stable
as $$
  select 'juan.dmzjob@gmail.com'::text;
$$;

create or replace function public.is_platform_superuser()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = public.platform_superuser_email();
$$;

create table if not exists public.platform_user_overrides (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'active' check (status in ('active','inactive')),
  permission_overrides jsonb not null default '{"allow":[],"deny":[]}'::jsonb,
  feature_overrides jsonb not null default '{"allow":[],"deny":[]}'::jsonb,
  page_overrides jsonb not null default '{"allow":[],"deny":[]}'::jsonb,
  notes text,
  created_by_user_id uuid,
  updated_by_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.platform_user_overrides
  add column if not exists page_overrides jsonb not null default '{"allow":[],"deny":[]}'::jsonb,
  add column if not exists notes text,
  add column if not exists created_by_user_id uuid,
  add column if not exists updated_by_user_id uuid,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists platform_user_overrides_email_idx on public.platform_user_overrides (lower(email));

alter table public.platform_user_overrides enable row level security;

drop policy if exists "platform overrides select own or platform" on public.platform_user_overrides;
create policy "platform overrides select own or platform"
on public.platform_user_overrides
for select
to authenticated
using (
  public.is_platform_superuser()
  or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

drop policy if exists "platform overrides insert platform only" on public.platform_user_overrides;
create policy "platform overrides insert platform only"
on public.platform_user_overrides
for insert
to authenticated
with check (public.is_platform_superuser());

drop policy if exists "platform overrides update platform only" on public.platform_user_overrides;
create policy "platform overrides update platform only"
on public.platform_user_overrides
for update
to authenticated
using (public.is_platform_superuser())
with check (public.is_platform_superuser());

alter table if exists public.company_members
  add column if not exists permission_overrides jsonb not null default '{"allow":[],"deny":[]}'::jsonb,
  add column if not exists feature_overrides jsonb not null default '{"allow":[],"deny":[]}'::jsonb,
  add column if not exists page_overrides jsonb not null default '{"allow":[],"deny":[]}'::jsonb;

create table if not exists public.platform_auth_admin_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  actor_email text,
  target_email text not null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists platform_auth_admin_events_target_email_idx on public.platform_auth_admin_events (lower(target_email));
create index if not exists platform_auth_admin_events_created_at_idx on public.platform_auth_admin_events (created_at desc);

alter table public.platform_auth_admin_events enable row level security;

drop policy if exists "platform auth admin events platform only" on public.platform_auth_admin_events;
create policy "platform auth admin events platform only"
on public.platform_auth_admin_events
for select
to authenticated
using (public.is_platform_superuser());

drop policy if exists "platform auth admin events insert platform only" on public.platform_auth_admin_events;
create policy "platform auth admin events insert platform only"
on public.platform_auth_admin_events
for insert
to authenticated
with check (public.is_platform_superuser());

-- Normaliza variantes históricas para evitar divergencias de UI y permisos.
update public.companies
set subscription_status = 'trial'
where lower(coalesce(subscription_status, '')) in ('trialing', 'on_trial');

update public.billing_subscriptions
set status = 'trial'
where lower(coalesce(status, '')) in ('trialing', 'on_trial');

update public.billing_subscriptions
set subscription_status = 'trial'
where lower(coalesce(subscription_status, '')) in ('trialing', 'on_trial');

insert into public.platform_user_overrides (email, status, notes)
values (public.platform_superuser_email(), 'active', 'Superusuario principal protegido')
on conflict (email) do update
set status = 'active',
    permission_overrides = '{"allow":[],"deny":[]}'::jsonb,
    feature_overrides = '{"allow":[],"deny":[]}'::jsonb,
    page_overrides = '{"allow":[],"deny":[]}'::jsonb,
    notes = 'Superusuario principal protegido',
    updated_at = now();

-- RPC de respaldo. La Edge Function 10T ya usa consultas directas con service_role,
-- pero esta función se conserva para fallback autenticado y diagnóstico.
drop function if exists public.platform_lookup_user_access(text);
create function public.platform_lookup_user_access(lookup_email text)
returns table (
  member_id uuid,
  company_id uuid,
  company_name text,
  company_plan text,
  company_subscription_status text,
  email text,
  full_name text,
  role text,
  status text,
  permission_overrides jsonb,
  feature_overrides jsonb,
  page_overrides jsonb,
  plan_id text,
  billing_status text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  next_billing_date date,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_superuser() then
    raise exception 'Solo el superusuario principal puede consultar usuarios globales';
  end if;

  return query
  select
    cm.id as member_id,
    cm.company_id,
    c.name::text as company_name,
    coalesce(c.active_plan_id, c.plan, 'demo')::text as company_plan,
    coalesce(c.subscription_status, 'trial')::text as company_subscription_status,
    cm.email::text,
    cm.full_name::text,
    cm.role::text,
    cm.status::text,
    coalesce(puo.permission_overrides, cm.permission_overrides, '{"allow":[],"deny":[]}'::jsonb) as permission_overrides,
    coalesce(puo.feature_overrides, cm.feature_overrides, '{"allow":[],"deny":[]}'::jsonb) as feature_overrides,
    coalesce(puo.page_overrides, cm.page_overrides, '{"allow":[],"deny":[]}'::jsonb) as page_overrides,
    coalesce(bs.plan_id, c.active_plan_id, c.plan, 'demo')::text as plan_id,
    coalesce(bs.status, bs.subscription_status, c.subscription_status, 'trial')::text as billing_status,
    bs.current_period_start::timestamptz,
    bs.current_period_end::timestamptz,
    bs.next_billing_date::date,
    cm.created_at,
    cm.updated_at
  from public.company_members cm
  left join public.companies c on c.id = cm.company_id
  left join lateral (
    select b.* from public.billing_subscriptions b
    where b.company_id = cm.company_id
    order by b.updated_at desc nulls last, b.created_at desc nulls last
    limit 1
  ) bs on true
  left join public.platform_user_overrides puo on lower(puo.email) = lower(cm.email)
  where lower(cm.email) = lower(trim(lookup_email))
  order by c.name nulls last, cm.created_at desc;
end;
$$;

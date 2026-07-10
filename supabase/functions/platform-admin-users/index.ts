import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

const PLATFORM_SUPERUSER_EMAIL = 'juan.dmzjob@gmail.com';
const DEFAULT_OVERRIDE = { allow: [], deny: [] };

function normalizeEmail(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function cleanOverride(value: unknown) {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const allow = Array.isArray(source.allow) ? source.allow.map(String).filter(Boolean) : [];
  const deny = Array.isArray(source.deny) ? source.deny.map(String).filter(Boolean) : [];
  return { allow: [...new Set(allow)], deny: [...new Set(deny)] };
}

function overrideOrDefault(value: unknown) {
  return cleanOverride(value || DEFAULT_OVERRIDE);
}

function nonFatalError(error: unknown) {
  return error && typeof error === 'object' && 'message' in error ? String((error as { message?: unknown }).message || error) : String(error || 'Error desconocido');
}

async function assertPlatformSuperuser(req: Request, serviceClient: any) {
  const authorization = req.headers.get('Authorization') || '';
  if (!authorization.toLowerCase().startsWith('bearer ')) {
    return { ok: false, response: jsonResponse({ ok: false, error: 'Debes iniciar sesión.' }, 401), user: null };
  }
  const token = authorization.replace(/^bearer\s+/i, '').trim();
  const { data, error } = await serviceClient.auth.getUser(token);
  const email = normalizeEmail(data?.user?.email);
  if (error || !data?.user || email !== PLATFORM_SUPERUSER_EMAIL) {
    return { ok: false, response: jsonResponse({ ok: false, error: 'Solo el superusuario principal puede administrar usuarios globales.' }, 403), user: null };
  }
  return { ok: true, response: null, user: data.user };
}

async function findAuthUserByEmail(serviceClient: any, email: string) {
  const perPage = 1000;
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await serviceClient.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users || [];
    const found = users.find((user: any) => normalizeEmail(user.email) === email);
    if (found) return found;
    if (users.length < perPage) break;
  }
  return null;
}

async function getPlatformOverride(serviceClient: any, email: string) {
  try {
    const { data, error } = await serviceClient
      .from('platform_user_overrides')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  } catch (error) {
    console.warn('platform_user_overrides no disponible:', nonFatalError(error));
    return null;
  }
}

async function lookupMembershipsDirect(serviceClient: any, email: string) {
  const { data: memberships, error: membersError } = await serviceClient
    .from('company_members')
    .select('id, company_id, email, full_name, role, status, permission_overrides, feature_overrides, page_overrides, created_at, updated_at')
    .ilike('email', email);
  if (membersError) throw membersError;

  const rows = Array.isArray(memberships) ? memberships : [];
  const companyIds = [...new Set(rows.map((row: any) => row.company_id).filter(Boolean))];

  let companiesById = new Map<string, any>();
  if (companyIds.length) {
    const { data: companies, error: companiesError } = await serviceClient
      .from('companies')
      .select('id, name, plan, active_plan_id, subscription_status, business_type')
      .in('id', companyIds);
    if (companiesError) throw companiesError;
    companiesById = new Map((companies || []).map((company: any) => [company.id, company]));
  }

  let billingByCompanyId = new Map<string, any>();
  if (companyIds.length) {
    const { data: bills, error: billsError } = await serviceClient
      .from('billing_subscriptions')
      .select('id, company_id, plan_id, status, subscription_status, current_period_start, current_period_end, next_billing_date, updated_at, created_at')
      .in('company_id', companyIds)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false, nullsFirst: false });
    if (!billsError) {
      for (const bill of bills || []) {
        if (!billingByCompanyId.has(bill.company_id)) billingByCompanyId.set(bill.company_id, bill);
      }
    } else {
      console.warn('billing_subscriptions no disponible:', billsError.message);
    }
  }

  const overrideRow = await getPlatformOverride(serviceClient, email);

  return rows.map((member: any) => {
    const company = companiesById.get(member.company_id) || {};
    const bill = billingByCompanyId.get(member.company_id) || {};
    return {
      member_id: member.id,
      id: member.id,
      auth_user_id: null,
      auth_only: false,
      company_id: member.company_id,
      company_name: company.name || 'Empresa sin nombre',
      company_plan: company.active_plan_id || company.plan || 'demo',
      company_subscription_status: company.subscription_status || 'trial',
      email: member.email,
      full_name: member.full_name || '',
      role: member.role || 'lector',
      status: member.status || 'active',
      permission_overrides: overrideRow?.permission_overrides || member.permission_overrides || DEFAULT_OVERRIDE,
      feature_overrides: overrideRow?.feature_overrides || member.feature_overrides || DEFAULT_OVERRIDE,
      page_overrides: overrideRow?.page_overrides || member.page_overrides || DEFAULT_OVERRIDE,
      plan_id: bill.plan_id || company.active_plan_id || company.plan || 'demo',
      billing_status: bill.status || bill.subscription_status || company.subscription_status || 'trial',
      current_period_start: bill.current_period_start || null,
      current_period_end: bill.current_period_end || null,
      next_billing_date: bill.next_billing_date || null,
      created_at: member.created_at,
      updated_at: member.updated_at
    };
  });
}

async function lookupAccess(serviceClient: any, email: string) {
  const overrideRow = await getPlatformOverride(serviceClient, email);
  const authUser = await findAuthUserByEmail(serviceClient, email);

  let rows: any[] = [];
  let lookupSource = 'direct';
  try {
    rows = await lookupMembershipsDirect(serviceClient, email);
  } catch (directError) {
    lookupSource = 'rpc-fallback';
    console.warn('Búsqueda directa falló, intentando RPC:', nonFatalError(directError));
    const { data: memberships, error: membershipsError } = await serviceClient.rpc('platform_lookup_user_access', { lookup_email: email });
    if (membershipsError) throw membershipsError;
    rows = Array.isArray(memberships) ? memberships : [];
  }

  if (!rows.length && authUser) {
    rows.push({
      member_id: `auth:${authUser.id}`,
      id: `auth:${authUser.id}`,
      auth_user_id: authUser.id,
      auth_only: true,
      company_id: null,
      company_name: 'Usuario Auth sin empresa asignada',
      company_plan: 'Sin licencia',
      company_subscription_status: authUser.banned_until ? 'inactive' : 'active',
      email,
      full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
      role: 'sin_membresia',
      status: authUser.banned_until ? 'inactive' : 'active',
      permission_overrides: overrideOrDefault(overrideRow?.permission_overrides),
      feature_overrides: overrideOrDefault(overrideRow?.feature_overrides),
      page_overrides: overrideOrDefault(overrideRow?.page_overrides),
      plan_id: 'sin_licencia',
      billing_status: authUser.banned_until ? 'inactive' : 'active',
      current_period_start: null,
      current_period_end: null,
      next_billing_date: null,
      created_at: authUser.created_at,
      updated_at: authUser.updated_at,
      last_sign_in_at: authUser.last_sign_in_at,
      email_confirmed_at: authUser.email_confirmed_at
    });
  }

  return { rows, source: lookupSource, auth_user: authUser ? {
    id: authUser.id,
    email: authUser.email,
    created_at: authUser.created_at,
    updated_at: authUser.updated_at,
    last_sign_in_at: authUser.last_sign_in_at,
    email_confirmed_at: authUser.email_confirmed_at,
    banned_until: authUser.banned_until || null,
    app_metadata: authUser.app_metadata || {},
    user_metadata: authUser.user_metadata || {}
  } : null };
}

async function upsertPlatformOverride(serviceClient: any, email: string, patch: Record<string, unknown>, actorId: string) {
  if (email === PLATFORM_SUPERUSER_EMAIL) throw new Error('El superusuario principal no puede ser limitado.');
  const status = ['active', 'inactive'].includes(String(patch.status || 'active')) ? String(patch.status || 'active') : 'active';
  const permissionOverrides = cleanOverride(patch.permission_overrides);
  const featureOverrides = cleanOverride(patch.feature_overrides);
  const pageOverrides = cleanOverride(patch.page_overrides);

  const { error } = await serviceClient
    .from('platform_user_overrides')
    .upsert({
      email,
      status,
      permission_overrides: permissionOverrides,
      feature_overrides: featureOverrides,
      page_overrides: pageOverrides,
      updated_by_user_id: actorId,
      updated_at: new Date().toISOString()
    }, { onConflict: 'email' });
  if (error) throw error;

  return { ok: true, email, status, permission_overrides: permissionOverrides, feature_overrides: featureOverrides, page_overrides: pageOverrides };
}

async function logAdminEvent(serviceClient: any, actor: any, targetEmail: string, action: string, metadata: Record<string, unknown> = {}) {
  try {
    await serviceClient.from('platform_auth_admin_events').insert({
      actor_user_id: actor?.id || null,
      actor_email: normalizeEmail(actor?.email),
      target_email: targetEmail || normalizeEmail(actor?.email),
      action,
      metadata
    });
  } catch (error) {
    console.warn('No se pudo registrar auditoría de administración Auth:', nonFatalError(error));
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ ok: false, error: 'Método no permitido.' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en Edge Functions.');

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const auth = await assertPlatformSuperuser(req, serviceClient);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '').trim();
    const email = normalizeEmail(body.email);

    if (!action) return jsonResponse({ ok: false, error: 'action es requerido.' }, 400);
    if (['health', 'ping'].includes(action)) {
      await logAdminEvent(serviceClient, auth.user, normalizeEmail(auth.user?.email), 'health', { ok: true });
      return jsonResponse({ ok: true, service: 'platform-admin-users', actor: normalizeEmail(auth.user?.email), timestamp: new Date().toISOString() });
    }
    if (action !== 'list' && !email) return jsonResponse({ ok: false, error: 'email es requerido.' }, 400);
    if (email === PLATFORM_SUPERUSER_EMAIL && ['update-global-access', 'disable-auth-user', 'enable-auth-user'].includes(action)) {
      return jsonResponse({ ok: false, error: 'El superusuario principal no puede ser modificado.' }, 403);
    }

    if (action === 'lookup') {
      const result = await lookupAccess(serviceClient, email);
      await logAdminEvent(serviceClient, auth.user, email, 'lookup', { source: result.source, rows: result.rows.length, auth_found: Boolean(result.auth_user) });
      return jsonResponse({ ok: true, ...result });
    }

    if (action === 'update-global-access') {
      const patch = body.patch && typeof body.patch === 'object' ? body.patch as Record<string, unknown> : {};
      const saved = await upsertPlatformOverride(serviceClient, email, patch, auth.user.id);
      await logAdminEvent(serviceClient, auth.user, email, 'update-global-access', { patch });
      const result = await lookupAccess(serviceClient, email);
      return jsonResponse({ ok: true, ...saved, ...result });
    }

    if (action === 'disable-auth-user' || action === 'enable-auth-user') {
      const authUser = await findAuthUserByEmail(serviceClient, email);
      if (!authUser) return jsonResponse({ ok: false, error: 'Usuario Auth no encontrado.' }, 404);
      if (action === 'disable-auth-user') {
        const { error } = await serviceClient.auth.admin.updateUserById(authUser.id, { ban_duration: '876000h' });
        if (error) throw error;
        await upsertPlatformOverride(serviceClient, email, { status: 'inactive' }, auth.user.id);
        await logAdminEvent(serviceClient, auth.user, email, 'disable-auth-user', { auth_user_id: authUser.id });
      } else {
        const { error } = await serviceClient.auth.admin.updateUserById(authUser.id, { ban_duration: 'none' });
        if (error) throw error;
        await upsertPlatformOverride(serviceClient, email, { status: 'active' }, auth.user.id);
        await logAdminEvent(serviceClient, auth.user, email, 'enable-auth-user', { auth_user_id: authUser.id });
      }
      const result = await lookupAccess(serviceClient, email);
      return jsonResponse({ ok: true, ...result });
    }

    if (action === 'send-recovery') {
      const redirectTo = String(body.redirect_to || '').trim() || undefined;
      const { error } = await serviceClient.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined);
      if (error) throw error;
      await logAdminEvent(serviceClient, auth.user, email, 'send-recovery', { redirect_to: redirectTo || null });
      return jsonResponse({ ok: true, message: 'Correo de recuperación solicitado desde Supabase Auth.' });
    }

    return jsonResponse({ ok: false, error: 'Acción no soportada.' }, 400);
  } catch (error) {
    console.error(error);
    return jsonResponse({ ok: false, error: nonFatalError(error), service: 'platform-admin-users' }, 400);
  }
});

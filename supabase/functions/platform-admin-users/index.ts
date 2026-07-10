import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

const PLATFORM_SUPERUSER_EMAIL = 'juan.dmzjob@gmail.com';
const OK_STATUS = 200;

function normalizeEmail(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}
function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}
function cleanOverride(value: unknown) {
  const source = asObject(value);
  const allow = Array.isArray(source.allow) ? source.allow.map(String).filter(Boolean) : [];
  const deny = Array.isArray(source.deny) ? source.deny.map(String).filter(Boolean) : [];
  return { allow: [...new Set(allow)], deny: [...new Set(deny)] };
}
function overrideOrDefault(value: unknown) {
  return cleanOverride(value || { allow: [], deny: [] });
}
function errorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) return String((error as { message?: unknown }).message || 'Error desconocido');
  return String(error || 'Error desconocido');
}
function ok(payload: Record<string, unknown> = {}) {
  return jsonResponse({ ok: true, service: 'platform-admin-users', ...payload }, OK_STATUS);
}
function fail(message: string, status = 400, extra: Record<string, unknown> = {}) {
  return jsonResponse({ ok: false, status, error: message, service: 'platform-admin-users', ...extra }, OK_STATUS);
}
function getEnv(name: string) {
  return String(Deno.env.get(name) || '').trim();
}
function getServiceRoleKey() {
  return getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('SERVICE_ROLE_KEY') || getEnv('SUPABASE_SERVICE_KEY');
}
function createServiceClient() {
  const supabaseUrl = getEnv('SUPABASE_URL');
  const serviceRoleKey = getServiceRoleKey();
  if (!supabaseUrl) throw new Error('Falta SUPABASE_URL en Edge Functions.');
  if (!serviceRoleKey) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en Edge Functions Secrets.');
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
async function assertPlatformSuperuser(req: Request, serviceClient: any) {
  const authorization = req.headers.get('Authorization') || '';
  if (!authorization.toLowerCase().startsWith('bearer ')) {
    return { ok: false, response: fail('Debes iniciar sesión. No llegó Authorization Bearer.', 401), user: null };
  }
  const token = authorization.replace(/^bearer\s+/i, '').trim();
  const { data, error } = await serviceClient.auth.getUser(token);
  const email = normalizeEmail(data?.user?.email);
  if (error || !data?.user) {
    return { ok: false, response: fail(`JWT inválido o sesión no disponible: ${error?.message || 'sin usuario'}`, 401), user: null };
  }
  if (email !== PLATFORM_SUPERUSER_EMAIL) {
    return { ok: false, response: fail('Solo el superusuario principal puede administrar usuarios globales.', 403, { actor_email: email }), user: null };
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
async function maybeSelect(serviceClient: any, table: string, select: string, build: (q: any) => any) {
  try {
    const q = serviceClient.from(table).select(select);
    const { data, error } = await build(q);
    if (error) throw error;
    return data;
  } catch (_error) {
    return null;
  }
}
async function getPlatformOverride(serviceClient: any, email: string) {
  return await maybeSelect(serviceClient, 'platform_user_overrides', '*', (q) => q.eq('email', email).maybeSingle());
}
async function lookupMembershipsDirect(serviceClient: any, email: string) {
  const memberships = await maybeSelect(serviceClient, 'company_members', '*', (q) => q.ilike('email', email));
  const rows = Array.isArray(memberships) ? memberships : [];
  const companyIds = [...new Set(rows.map((row: any) => row.company_id).filter(Boolean))];
  const companies = companyIds.length ? await maybeSelect(serviceClient, 'companies', '*', (q) => q.in('id', companyIds)) : [];
  const bills = companyIds.length ? await maybeSelect(serviceClient, 'billing_subscriptions', '*', (q) => q.in('company_id', companyIds)) : [];
  const companiesById = new Map((companies || []).map((company: any) => [company.id, company]));
  const billingByCompanyId = new Map();
  for (const bill of bills || []) if (!billingByCompanyId.has(bill.company_id)) billingByCompanyId.set(bill.company_id, bill);
  const overrideRow = await getPlatformOverride(serviceClient, email);
  return rows.map((member: any) => {
    const company = companiesById.get(member.company_id) || {};
    const bill = billingByCompanyId.get(member.company_id) || {};
    return {
      member_id: member.id,
      id: member.id,
      auth_user_id: member.user_id || member.auth_user_id || null,
      auth_only: false,
      company_id: member.company_id,
      company_name: company.name || company.company_name || 'Empresa sin nombre',
      company_plan: company.active_plan_id || company.plan || bill.plan_id || 'demo',
      company_subscription_status: company.subscription_status || bill.subscription_status || bill.status || 'trial',
      email: member.email,
      full_name: member.full_name || member.name || '',
      role: member.role || 'lector',
      status: member.status || 'active',
      permission_overrides: overrideOrDefault(overrideRow?.permission_overrides || member.permission_overrides),
      feature_overrides: overrideOrDefault(overrideRow?.feature_overrides || member.feature_overrides),
      page_overrides: overrideOrDefault(overrideRow?.page_overrides || member.page_overrides),
      plan_id: bill.plan_id || company.active_plan_id || company.plan || 'demo',
      billing_status: bill.status || bill.subscription_status || company.subscription_status || 'trial',
      current_period_start: bill.current_period_start || null,
      current_period_end: bill.current_period_end || null,
      next_billing_date: bill.next_billing_date || null,
      created_at: member.created_at || null,
      updated_at: member.updated_at || null
    };
  });
}
async function lookupAccess(serviceClient: any, email: string) {
  const overrideRow = await getPlatformOverride(serviceClient, email);
  let authUser: any = null;
  let authAdminError = '';
  try { authUser = await findAuthUserByEmail(serviceClient, email); } catch (error) { authAdminError = errorMessage(error); }
  let rows = await lookupMembershipsDirect(serviceClient, email);
  if (!rows.length) {
    try {
      const { data, error } = await serviceClient.rpc('platform_lookup_user_access', { lookup_email: email });
      if (!error && Array.isArray(data)) rows = data;
    } catch (_error) {
      rows = [];
    }
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
  return { rows, auth_admin_error: authAdminError || null, auth_user: authUser ? { id: authUser.id, email: authUser.email, created_at: authUser.created_at, updated_at: authUser.updated_at, last_sign_in_at: authUser.last_sign_in_at, email_confirmed_at: authUser.email_confirmed_at, banned_until: authUser.banned_until || null } : null };
}
async function upsertPlatformOverride(serviceClient: any, email: string, patch: Record<string, unknown>, actorId: string) {
  if (email === PLATFORM_SUPERUSER_EMAIL) throw new Error('El superusuario principal no puede ser limitado.');
  const status = ['active', 'inactive'].includes(String(patch.status || 'active')) ? String(patch.status || 'active') : 'active';
  const payload = {
    email,
    status,
    permission_overrides: cleanOverride(patch.permission_overrides),
    feature_overrides: cleanOverride(patch.feature_overrides),
    page_overrides: cleanOverride(patch.page_overrides),
    updated_by_user_id: actorId,
    updated_at: new Date().toISOString()
  };
  const { error } = await serviceClient.from('platform_user_overrides').upsert(payload, { onConflict: 'email' });
  if (error) throw error;
  return payload;
}
async function logAdminEvent(serviceClient: any, actor: any, targetEmail: string, action: string, metadata: Record<string, unknown> = {}) {
  try {
    const { error } = await serviceClient.from('platform_auth_admin_events').insert({
      actor_user_id: actor?.id || null,
      actor_email: normalizeEmail(actor?.email),
      target_email: targetEmail || normalizeEmail(actor?.email),
      action,
      metadata
    });
    if (error) console.warn('platform_auth_admin_events insert skipped:', error.message);
  } catch (error) {
    console.warn('platform_auth_admin_events insert failed:', errorMessage(error));
  }
}
async function readJsonBody(req: Request) {
  try {
    return await req.json();
  } catch (_error) {
    return {};
  }
}
Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    if (req.method !== 'POST') return fail('Método no permitido.', 405);
    const serviceClient = createServiceClient();
    const body = await readJsonBody(req);
    const action = String(body.action || '').trim();
    const email = normalizeEmail(body.email);
    if (!action) return fail('action es requerido.', 400);
    const auth = await assertPlatformSuperuser(req, serviceClient);
    if (!auth.ok) return auth.response;
    if (['health', 'ping'].includes(action)) {
      let authAdminOk = true;
      let authAdminError = '';
      try { await serviceClient.auth.admin.listUsers({ page: 1, perPage: 1 }); } catch (error) { authAdminOk = false; authAdminError = errorMessage(error); }
      await logAdminEvent(serviceClient, auth.user, normalizeEmail(auth.user?.email), 'health', { auth_admin_ok: authAdminOk, auth_admin_error: authAdminError || null });
      return ok({ actor: normalizeEmail(auth.user?.email), auth_admin_ok: authAdminOk, auth_admin_error: authAdminError || null, timestamp: new Date().toISOString() });
    }
    if (action !== 'list' && !email) return fail('email es requerido.', 400);
    if (email === PLATFORM_SUPERUSER_EMAIL && ['update-global-access', 'disable-auth-user', 'enable-auth-user'].includes(action)) return fail('El superusuario principal no puede ser modificado.', 403);
    if (action === 'lookup') {
      const result = await lookupAccess(serviceClient, email);
      await logAdminEvent(serviceClient, auth.user, email, 'lookup', { rows: result.rows.length, auth_found: Boolean(result.auth_user), auth_admin_error: result.auth_admin_error || null });
      return ok(result);
    }
    if (action === 'update-global-access') {
      const patch = asObject(body.patch);
      const saved = await upsertPlatformOverride(serviceClient, email, patch, auth.user.id);
      await logAdminEvent(serviceClient, auth.user, email, 'update-global-access', { patch });
      const result = await lookupAccess(serviceClient, email);
      return ok({ saved, ...result });
    }
    if (action === 'disable-auth-user' || action === 'enable-auth-user') {
      const authUser = await findAuthUserByEmail(serviceClient, email);
      if (!authUser) return fail('Usuario Auth no encontrado.', 404);
      const { error } = await serviceClient.auth.admin.updateUserById(authUser.id, { ban_duration: action === 'disable-auth-user' ? '876000h' : 'none' });
      if (error) throw error;
      await upsertPlatformOverride(serviceClient, email, { status: action === 'disable-auth-user' ? 'inactive' : 'active' }, auth.user.id);
      await logAdminEvent(serviceClient, auth.user, email, action, { auth_user_id: authUser.id });
      const result = await lookupAccess(serviceClient, email);
      return ok(result);
    }
    if (action === 'send-recovery') {
      const redirectTo = String(body.redirect_to || '').trim() || undefined;
      const { error } = await serviceClient.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined);
      if (error) throw error;
      await logAdminEvent(serviceClient, auth.user, email, 'send-recovery', { redirect_to: redirectTo || null });
      return ok({ message: 'Correo de recuperación solicitado desde Supabase Auth.' });
    }
    return fail('Acción no soportada.', 400);
  } catch (error) {
    return fail(errorMessage(error), 500);
  }
});

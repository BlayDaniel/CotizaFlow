const STORAGE_KEY = 'cotizaflow_fase2_local_state_v1';
const config = window.COTIZAFLOW_CONFIG || {};
const app = document.getElementById('app');
const REFERRAL_STORAGE_KEY = 'cotizaflow_pending_referral_code_v1';

const PLAN_CATALOG = {
  free: { name: 'Free', price: 0, quoteLimit: 5, users: 1, catalogLimit: 10, description: 'Prueba limitada para validar el producto.' },
  starter: { name: 'Starter', price: 9, quoteLimit: 50, users: 1, catalogLimit: 50, description: 'Para negocios pequeños que cotizan con frecuencia moderada.' },
  enterprise: { name: 'Enterprise', price: 39, quoteLimit: 500, users: 3, catalogLimit: 500, description: 'Mayor volumen, equipo pequeño, plantillas y reportes.' },
  custom: { name: 'A cotizar', price: null, quoteLimit: 500, users: 10, catalogLimit: 1000, description: 'Para empresas con alto volumen, múltiples usuarios o necesidades especiales.' }
};

const ACTIVE_BILLING_STATUSES = new Set(['active', 'trialing', 'on_trial', 'paid']);

let supabaseClient = null;
let mode = 'local';
let state = {
  loading: true,
  session: null,
  company: null,
  clients: [],
  quotes: [],
  billing: null,
  affiliate: null,
  referrals: [],
  commissions: [],
  publicLinks: [],
  quoteEvents: [],
  messageLogs: [],
  messageTemplates: [],
  productsServices: [],
  businessTemplates: [],
  pendingReferralCode: captureReferralCode(),
  reportFilters: { period: 'all', status: 'all', attention: 'all' },
  authMessage: '',
  activeAuthTab: 'login'
};

const defaultCompany = {
  name: 'Mi Empresa SRL',
  tax_id: '',
  email: '',
  phone: '',
  address: '',
  currency: 'USD',
  tax_rate: 0,
  logo_data_url: '',
  plan: 'free',
  subscription_status: 'trialing',
  business_type: 'general',
  default_quote_notes: 'Gracias por considerar nuestra propuesta. Esta cotización está sujeta a disponibilidad y vigencia indicada.',
  default_terms: '',
  default_whatsapp_template: ''
};

const localDefaultState = {
  session: null,
  company: { ...defaultCompany },
  clients: [],
  quotes: [],
  billing: null,
  affiliate: null,
  referrals: [],
  commissions: [],
  publicLinks: [],
  quoteEvents: [],
  messageLogs: [],
  messageTemplates: [],
  productsServices: [],
  businessTemplates: [],
  reportFilters: { period: 'all', status: 'all', attention: 'all' }
};

function sanitizeReferralCode(value) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24);
}

function captureReferralCode() {
  try {
    const url = new URL(window.location.href);
    const hashQuery = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '';
    const hashParams = new URLSearchParams(hashQuery);
    const code = sanitizeReferralCode(url.searchParams.get('ref') || url.searchParams.get('affiliate') || hashParams.get('ref'));
    if (code) localStorage.setItem(REFERRAL_STORAGE_KEY, code);
    return code || localStorage.getItem(REFERRAL_STORAGE_KEY) || '';
  } catch (_error) {
    return localStorage.getItem(REFERRAL_STORAGE_KEY) || '';
  }
}

function getPendingReferralCode() {
  return sanitizeReferralCode(state.pendingReferralCode || localStorage.getItem(REFERRAL_STORAGE_KEY) || '');
}

init();

async function init() {
  const hasSupabaseConfig = Boolean(config.supabaseUrl && config.supabaseAnonKey);
  if (hasSupabaseConfig && window.supabase && window.supabase.createClient) {
    mode = 'supabase';
    supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });

    supabaseClient.auth.onAuthStateChange((_event, session) => {
      // Supabase recomienda no esperar queries dentro del callback de Auth.
      // Se difiere la carga para evitar que la pantalla quede fija en "Cargando...".
      setTimeout(async () => {
        try {
          if (session?.user) {
            state.session = normalizeSession(session.user);
            await loadRemoteData();
          } else {
            state.loading = false;
            state.session = null;
            state.company = null;
            state.clients = [];
            state.quotes = [];
            render();
          }
        } catch (error) {
          console.error(error);
          state.loading = false;
          state.authMessage = error.message || 'No se pudo cargar la sesión.';
          render();
        }
      }, 0);
    });

    const { data, error } = await supabaseClient.auth.getSession();
    if (error) state.authMessage = error.message;
    if (data?.session?.user) {
      state.session = normalizeSession(data.session.user);
      await loadRemoteData();
    } else {
      state.loading = false;
      render();
    }
  } else {
    mode = 'local';
    const local = loadLocalState();
    state = { ...state, ...local, loading: false };
    render();
  }
}

function loadLocalState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      ...clone(localDefaultState),
      ...parsed,
      company: { ...defaultCompany, ...(parsed.company || {}) },
      clients: parsed.clients || [],
      quotes: parsed.quotes || [],
      billing: parsed.billing || null,
      affiliate: parsed.affiliate || null,
      referrals: parsed.referrals || [],
      commissions: parsed.commissions || [],
      publicLinks: parsed.publicLinks || [],
      quoteEvents: parsed.quoteEvents || [],
      messageLogs: parsed.messageLogs || [],
      messageTemplates: parsed.messageTemplates || [],
      productsServices: parsed.productsServices || [],
      businessTemplates: parsed.businessTemplates || [],
      reportFilters: parsed.reportFilters || { period: 'all', status: 'all', attention: 'all' }
    };
  } catch (error) {
    console.error(error);
    return clone(localDefaultState);
  }
}

function saveLocalState() {
  if (mode !== 'local') return;
  const data = {
    session: state.session,
    company: state.company,
    clients: state.clients,
    quotes: state.quotes,
    billing: state.billing,
    affiliate: state.affiliate,
    referrals: state.referrals,
    commissions: state.commissions,
    publicLinks: state.publicLinks,
    quoteEvents: state.quoteEvents,
    messageLogs: state.messageLogs,
    messageTemplates: state.messageTemplates,
    productsServices: state.productsServices,
    businessTemplates: state.businessTemplates,
    reportFilters: state.reportFilters
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeSession(user) {
  return {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.full_name || user.email || 'Usuario',
    provider: mode
  };
}

async function loadRemoteData() {
  try {
    state.loading = true;
    render();

    const company = await getOrCreateRemoteCompany();
    state.company = normalizeCompany(company);
    await claimPendingReferral(state.company.id);
    await seedDefaultTemplates(state.company.id);

    const [
      { data: clients, error: clientsError },
      { data: quotes, error: quotesError },
      { data: billingRows, error: billingError },
      { data: affiliate, error: affiliateError },
      { data: publicLinks, error: publicLinksError },
      { data: quoteEvents, error: quoteEventsError },
      { data: messageLogs, error: messageLogsError },
      { data: messageTemplates, error: messageTemplatesError },
      { data: productsServices, error: productsServicesError },
      { data: businessTemplates, error: businessTemplatesError }
    ] = await Promise.all([
      supabaseClient.from('clients').select('*').eq('company_id', state.company.id).order('created_at', { ascending: false }),
      supabaseClient.from('quotes').select('*, quote_items(*)').eq('company_id', state.company.id).order('created_at', { ascending: false }),
      supabaseClient.from('billing_subscriptions').select('*').eq('company_id', state.company.id).order('updated_at', { ascending: false }).limit(1),
      supabaseClient.from('affiliates').select('*').eq('user_id', state.session.id).maybeSingle(),
      supabaseClient.from('quote_public_links').select('*').eq('company_id', state.company.id).order('created_at', { ascending: false }),
      supabaseClient.from('quote_events').select('*').eq('company_id', state.company.id).order('created_at', { ascending: false }).limit(200),
      supabaseClient.from('message_logs').select('*').eq('company_id', state.company.id).order('created_at', { ascending: false }).limit(200),
      supabaseClient.from('message_templates').select('*').eq('company_id', state.company.id).order('channel', { ascending: true }).order('name', { ascending: true }),
      supabaseClient.from('products_services').select('*').eq('company_id', state.company.id).order('is_active', { ascending: false }).order('category', { ascending: true }).order('name', { ascending: true }),
      supabaseClient.from('business_type_templates').select('*').eq('is_active', true).order('business_type', { ascending: true }).order('category', { ascending: true }).order('name', { ascending: true })
    ]);

    if (clientsError) throw clientsError;
    if (quotesError) throw quotesError;
    if (billingError) throw billingError;
    if (affiliateError) throw affiliateError;
    if (publicLinksError) throw publicLinksError;
    if (quoteEventsError) throw quoteEventsError;
    if (messageLogsError) throw messageLogsError;
    if (messageTemplatesError) throw messageTemplatesError;
    if (productsServicesError) throw productsServicesError;
    if (businessTemplatesError) throw businessTemplatesError;

    state.billing = billingRows?.[0] || null;
    state.affiliate = affiliate || null;
    state.publicLinks = publicLinks || [];
    state.quoteEvents = quoteEvents || [];
    state.messageLogs = messageLogs || [];
    state.messageTemplates = messageTemplates || [];
    state.productsServices = productsServices || [];
    state.businessTemplates = businessTemplates || [];

    if (state.affiliate?.id) {
      const [{ data: referrals }, { data: commissions }] = await Promise.all([
        supabaseClient.from('referrals').select('*').eq('affiliate_id', state.affiliate.id).order('created_at', { ascending: false }),
        supabaseClient.from('commissions').select('*').eq('affiliate_id', state.affiliate.id).order('created_at', { ascending: false })
      ]);
      state.referrals = referrals || [];
      state.commissions = commissions || [];
    } else {
      state.referrals = [];
      state.commissions = [];
    }

    state.clients = clients || [];
    state.quotes = (quotes || []).map(q => ({
      ...q,
      items: (q.quote_items || [])
        .sort((a, b) => Number(a.position || 0) - Number(b.position || 0))
        .map(item => ({
          id: item.id,
          description: item.description,
          quantity: Number(item.quantity || 0),
          unit_price: Number(item.unit_price || 0),
          total: Number(item.total || 0)
        }))
    }));
  } catch (error) {
    console.error(error);
    state.authMessage = error.message || 'No se pudo cargar Supabase.';
  } finally {
    state.loading = false;
    render();
  }
}

async function getOrCreateRemoteCompany() {
  const { data: existing, error: existingError } = await supabaseClient
    .from('companies')
    .select('*')
    .eq('owner_user_id', state.session.id)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing;

  const { data, error } = await supabaseClient
    .from('companies')
    .insert({
      owner_user_id: state.session.id,
      name: 'Mi Empresa SRL',
      email: state.session.email,
      currency: 'USD',
      tax_rate: 0,
      plan: 'free',
      subscription_status: 'trialing',
      business_type: 'general',
      default_quote_notes: defaultCompany.default_quote_notes
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

function normalizeCompany(company) {
  return { ...defaultCompany, ...(company || {}) };
}


async function claimPendingReferral(companyId) {
  const code = getPendingReferralCode();
  if (!code || mode !== 'supabase' || !supabaseClient || !companyId) return;
  const { error } = await supabaseClient.rpc('claim_referral', {
    ref_code: code,
    target_company_id: companyId
  });
  if (!error) {
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
    state.pendingReferralCode = '';
  } else {
    console.warn('No se pudo registrar referido:', error.message);
  }
}

async function seedDefaultTemplates(companyId) {
  if (mode !== 'supabase' || !supabaseClient || !companyId) return;
  const seededKey = `cotizaflow_templates_seeded_${companyId}`;
  if (sessionStorage.getItem(seededKey)) return;
  const { error } = await supabaseClient.rpc('seed_default_message_templates', { target_company_id: companyId });
  if (error) console.warn('No se pudieron crear plantillas base:', error.message);
  sessionStorage.setItem(seededKey, '1');
}

function hasUsableSubscription() {
  const status = state.billing?.status || state.company?.subscription_status || 'inactive';
  const periodEnd = state.billing?.current_period_end || state.company?.plan_current_period_end;
  if (ACTIVE_BILLING_STATUSES.has(status)) return true;
  if (periodEnd && new Date(periodEnd).getTime() > Date.now()) return true;
  return false;
}

function normalizePlanKey(planValue) {
  const plan = String(planValue || 'free').toLowerCase();
  if (plan === 'business') return 'enterprise';
  if (plan === 'pro') return 'starter';
  if (PLAN_CATALOG[plan]) return plan;
  return 'free';
}

function getEffectivePlanKey() {
  const plan = normalizePlanKey(state.billing?.plan || state.company?.plan || 'free');
  if (plan === 'free') return 'free';
  if (plan === 'custom') return hasUsableSubscription() ? 'custom' : 'free';
  return hasUsableSubscription() ? (PLAN_CATALOG[plan] ? plan : 'free') : 'free';
}

function getEffectivePlan() {
  return PLAN_CATALOG[getEffectivePlanKey()] || PLAN_CATALOG.free;
}

function getMonthStartISO() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
}

function getMonthlyQuoteCount() {
  const start = getMonthStartISO();
  return state.quotes.filter(q => !q.created_at || String(q.created_at) >= start).length;
}

function getPlanUsage() {
  const planKey = getEffectivePlanKey();
  const plan = getEffectivePlan();
  const used = getMonthlyQuoteCount();
  const limit = Number(plan.quoteLimit || 0);
  const remaining = Math.max(0, limit - used);
  const percent = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return { planKey, plan, used, limit, remaining, percent };
}

function canCreateQuote() {
  const usage = getPlanUsage();
  return usage.used < usage.limit;
}

function planStatusText() {
  const plan = getEffectivePlan();
  const rawStatus = state.billing?.status || state.company?.subscription_status || 'inactive';
  return `${plan.name} · ${rawStatus}`;
}

function getRoute() {
  return window.location.hash.replace('#', '') || (state.session ? 'dashboard' : 'home');
}

function setRoute(route) {
  window.location.hash = route;
}

function toast(message) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function uid(prefix = 'id') {
  if (window.crypto && window.crypto.randomUUID) return `${prefix}_${window.crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(days) {
  const date = new Date();
  date.setDate(date.getDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
}

function money(value) {
  const currency = state.company?.currency || 'USD';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(value || 0));
}

function statusLabel(status) {
  return {
    draft: 'Borrador',
    sent: 'Enviada',
    accepted: 'Aceptada',
    rejected: 'Rechazada',
    expired: 'Vencida'
  }[status] || status;
}

function statusBadge(status) {
  return `<span class="badge ${escapeHtml(status)}">${statusLabel(status)}</span>`;
}

function quoteTotals(quote) {
  const items = quote.items || [];
  const subtotal = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const taxRate = Number(quote.tax_rate ?? state.company?.tax_rate ?? 0);
  const tax = subtotal * (taxRate / 100);
  return { subtotal, tax, total: subtotal + tax };
}

function getClient(clientId) {
  return state.clients.find(c => c.id === clientId) || null;
}

function appBaseUrl() {
  const path = location.pathname.endsWith('/') ? location.pathname : location.pathname.replace(/\/[^/]*$/, '/');
  return `${location.origin}${path}`;
}

function publicUrlFromToken(token) {
  return `${appBaseUrl()}public.html?t=${encodeURIComponent(token)}`;
}

function getActivePublicLink(quoteId) {
  const now = Date.now();
  return state.publicLinks
    .filter(link => link.quote_id === quoteId && !link.revoked_at && (!link.expires_at || new Date(link.expires_at).getTime() > now))
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))[0] || null;
}

function getQuoteEvents(quoteId) {
  return state.quoteEvents.filter(e => e.quote_id === quoteId).sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
}

function getQuoteMessageLogs(quoteId) {
  return state.messageLogs.filter(e => e.quote_id === quoteId).sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
}

function eventLabel(type) {
  return {
    link_created: 'Link creado',
    viewed: 'Visto por cliente',
    pdf_downloaded: 'PDF descargado',
    accepted: 'Aceptada por cliente',
    rejected: 'Rechazada por cliente',
    commented: 'Comentario recibido',
    whatsapp_opened: 'WhatsApp abierto',
    whatsapp_copied: 'WhatsApp copiado',
    email_sent: 'Email enviado',
    manual_followup: 'Seguimiento manual',
    status_changed: 'Estado cambiado'
  }[type] || type;
}

function formatDateTime(value) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('es-DO', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
  } catch (_error) {
    return String(value || '');
  }
}

function formatDate(value) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(new Date(value));
  } catch (_error) {
    return String(value || '');
  }
}

function safeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(dateA, dateB = new Date()) {
  const a = safeDate(dateA);
  const b = safeDate(dateB);
  if (!a || !b) return null;
  const ms = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime() - new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round(ms / 86400000);
}

function applyTemplate(template, quote, publicUrl = '') {
  const client = getClient(quote.client_id);
  const totals = quoteTotals(quote);
  return String(template || '')
    .replaceAll('{{client_name}}', client?.name || 'cliente')
    .replaceAll('{{quote_number}}', quote.quote_number || '')
    .replaceAll('{{quote_total}}', money(totals.total))
    .replaceAll('{{public_link}}', publicUrl || '')
    .replaceAll('{{company_name}}', state.company?.name || '');
}

function getTemplate(channel, name) {
  return state.messageTemplates.find(t => t.channel === channel && t.name === name && t.status === 'active') || null;
}

function nextQuoteNumber() {
  const year = new Date().getFullYear();
  const count = state.quotes.length + 1;
  return `CF-${year}-${String(count).padStart(4, '0')}`;
}

function render() {
  if (state.loading) {
    app.innerHTML = `
      <main class="landing app-page">
        <div class="loading-card">
          <div class="brand"><span class="brand-mark">C</span> CotizaFlow</div>
          <p>Cargando...</p>
        </div>
      </main>
    `;
    return;
  }

  const route = getRoute();
  if (!state.session) renderPublic(route);
  else renderApp(route);
}

function renderPublic(route) {
  const usingSupabase = mode === 'supabase';
  app.innerHTML = `
    <main class="landing app-page">
      <div class="landing-inner">
        <header class="topbar">
          <div class="brand"><span class="brand-mark">C</span> CotizaFlow</div>
          <div class="nav-actions">
            <button class="btn ghost" data-route="auth">Entrar</button>
            <button class="btn primary" data-action="start-demo">Probar demo local</button>
          </div>
        </header>

        <section class="hero">
          <div>
            <span class="eyebrow">Fase 6 · ${usingSupabase ? 'Supabase conectado' : 'modo local hasta configurar Supabase'}</span>
            <h1>Cotizaciones profesionales con seguimiento comercial.</h1>
            <p>Crea clientes, cotizaciones y PDF. La fase 6 agrega dashboard comercial, alertas de seguimiento, métricas de cierre y reportes accionables.</p>
            <div class="hero-actions">
              <button class="btn primary" data-route="auth">Crear cuenta</button>
              <button class="btn secondary" data-action="start-demo">Demo local</button>
            </div>
            <div class="bullets">
              <span>Auth por correo y contraseña cuando Supabase está configurado.</span>
              <span>Base de datos PostgreSQL con RLS para aislar empresas.</span>
              <span>Dashboard comercial con pendientes, vencidas, vistas sin respuesta y tasa de cierre.</span>
              <span>Referidos con comisión recurrente por 12 meses.</span>
            </div>
          </div>

          <div class="preview-card">
            <div class="quote-preview">
              <div class="quote-preview-header">
                <div>
                  <h3>Cotización</h3>
                  <div class="num">CF-2026-0001</div>
                </div>
                ${statusBadge('sent')}
              </div>
              <div class="quote-line"><span>Servicio profesional</span><strong>US$350.00</strong></div>
              <div class="quote-line"><span>Materiales</span><strong>US$180.00</strong></div>
              <div class="quote-line"><span>Instalación</span><strong>US$75.00</strong></div>
              <div class="quote-total"><span>Total</span><span>US$605.00</span></div>
            </div>
          </div>
        </section>

        <section id="auth" class="login-box ${route === 'auth' ? '' : 'hidden'}">
          ${renderAuthBox()}
        </section>
      </div>
    </main>
  `;
}

function renderAuthBox() {
  const disabled = mode !== 'supabase';
  return `
    <div class="auth-tabs">
      <button class="auth-tab ${state.activeAuthTab === 'login' ? 'active' : ''}" data-auth-tab="login">Entrar</button>
      <button class="auth-tab ${state.activeAuthTab === 'register' ? 'active' : ''}" data-auth-tab="register">Crear cuenta</button>
    </div>
    ${state.authMessage ? `<div class="notice">${escapeHtml(state.authMessage)}</div>` : ''}
    ${disabled ? `
      <div class="notice warning">
        Supabase no está configurado. Puedes usar el demo local o editar <strong>config.js</strong> con tus credenciales públicas.
      </div>
    ` : ''}
    <form data-form="auth" class="form-grid">
      ${state.activeAuthTab === 'register' ? `
        <div class="field">
          <label>Nombre</label>
          <input name="name" placeholder="Tu nombre" ${disabled ? 'disabled' : ''} />
        </div>
      ` : ''}
      <div class="field">
        <label>Correo</label>
        <input name="email" type="email" required placeholder="tuempresa@email.com" ${disabled ? 'disabled' : ''} />
      </div>
      <div class="field">
        <label>Contraseña</label>
        <input name="password" type="password" required minlength="6" placeholder="Mínimo 6 caracteres" ${disabled ? 'disabled' : ''} />
      </div>
      <button class="btn primary full" type="submit" ${disabled ? 'disabled' : ''}>
        ${state.activeAuthTab === 'register' ? 'Crear cuenta' : 'Entrar'}
      </button>
      <button class="btn secondary full" type="button" data-action="start-demo">Usar demo local</button>
    </form>
  `;
}

function renderApp(route) {
  app.innerHTML = `
    <div class="layout app-page">
      <aside class="sidebar">
        <div class="brand"><span class="brand-mark">C</span> CotizaFlow</div>
        <nav>
          ${navLink('dashboard', 'Dashboard')}
          ${navLink('quotes', 'Cotizaciones')}
          ${navLink('quote-new', 'Nueva cotización')}
          ${navLink('reports', 'Seguimiento')}
          ${navLink('clients', 'Clientes')}
          ${navLink('catalog', 'Catálogo')}
          ${navLink('templates', 'Plantillas')}
          ${navLink('settings', 'Empresa')}
          ${navLink('billing', 'Planes y pagos')}
          ${navLink('affiliates', 'Referidos')}
          ${navLink('integrations', 'Integraciones')}
        </nav>
        <div class="sidebar-footer">
          <strong>${escapeHtml(state.company?.name || 'Mi empresa')}</strong><br />
          ${mode === 'supabase' ? 'Modo Supabase' : 'Modo demo local'}<br />
          Plan: ${escapeHtml(planStatusText())}<br />
          <button class="btn secondary small" data-action="logout" style="margin-top:12px;">Salir</button>
        </div>
      </aside>
      <main class="main">${renderRoute(route)}</main>
    </div>
  `;
}

function navLink(route, label) {
  return `<button class="nav-link ${getRoute() === route ? 'active' : ''}" data-route="${route}">${label}</button>`;
}

function renderRoute(route) {
  if (route.startsWith('quote-edit/')) return renderQuoteForm(route.split('/')[1]);
  if (route.startsWith('quote-view/')) return renderQuoteView(route.split('/')[1]);

  switch (route) {
    case 'quotes': return renderQuotes();
    case 'quote-new': return renderQuoteForm();
    case 'reports': return renderReports();
    case 'clients': return renderClients();
    case 'catalog': return renderCatalog();
    case 'templates': return renderTemplates();
    case 'settings': return renderSettings();
    case 'billing': return renderBilling();
    case 'affiliates': return renderAffiliates();
    case 'integrations': return renderIntegrations();
    case 'dashboard':
    default: return renderDashboard();
  }
}

function getQuoteEventTypes(quoteId) {
  return getQuoteEvents(quoteId).map(e => e.event_type);
}

function getLastQuoteEventDate(quoteId, eventTypes = []) {
  const types = new Set(eventTypes);
  const event = getQuoteEvents(quoteId).find(e => !types.size || types.has(e.event_type));
  return event?.created_at || '';
}

function getLastMessageDate(quoteId) {
  return getQuoteMessageLogs(quoteId)[0]?.created_at || '';
}

function isTerminalQuote(quote) {
  return ['accepted', 'rejected', 'expired'].includes(String(quote.status || '').toLowerCase());
}

function isQuoteExpired(quote) {
  if (isTerminalQuote(quote) && quote.status !== 'expired') return false;
  const days = daysBetween(quote.valid_until);
  return days !== null && days < 0 && !['accepted', 'rejected'].includes(quote.status);
}

function isQuoteExpiringSoon(quote, daysWindow = 7) {
  if (isTerminalQuote(quote)) return false;
  const days = daysBetween(quote.valid_until);
  return days !== null && days >= 0 && days <= daysWindow;
}

function getQuoteCommercialStatus(quote) {
  if (quote.status === 'accepted') return 'accepted';
  if (quote.status === 'rejected') return 'rejected';
  if (quote.status === 'expired' || isQuoteExpired(quote)) return 'expired';
  const events = getQuoteEventTypes(quote.id);
  if (quote.status === 'sent' && events.includes('viewed')) return 'viewed_no_response';
  if (quote.status === 'sent') return 'sent_not_viewed';
  return quote.status || 'draft';
}

function commercialStatusLabel(status) {
  return {
    draft: 'Borrador',
    sent: 'Enviada',
    sent_not_viewed: 'Enviada sin ver',
    viewed_no_response: 'Vista sin respuesta',
    accepted: 'Aceptada',
    rejected: 'Rechazada',
    expired: 'Vencida'
  }[status] || statusLabel(status);
}

function commercialBadge(status) {
  const css = {
    sent_not_viewed: 'sent',
    viewed_no_response: 'warning',
    expired: 'expired'
  }[status] || status;
  return `<span class="badge ${escapeHtml(css)}">${escapeHtml(commercialStatusLabel(status))}</span>`;
}

function quoteNeedsFollowup(quote) {
  const status = getQuoteCommercialStatus(quote);
  if (['accepted', 'rejected', 'expired', 'draft'].includes(status)) return false;
  const lastContact = getLastMessageDate(quote.id) || getLastQuoteEventDate(quote.id, ['whatsapp_opened','whatsapp_copied','manual_followup','email_sent','link_created','viewed']) || quote.sent_at || quote.updated_at || quote.created_at;
  const daysSince = lastContact ? Math.abs(daysBetween(new Date(), lastContact)) : 999;
  return status === 'viewed_no_response' || status === 'sent_not_viewed' || daysSince >= 2 || isQuoteExpiringSoon(quote, 3);
}

function getCommercialAnalytics() {
  const quotes = state.quotes || [];
  const enriched = quotes.map(q => {
    const totals = quoteTotals(q);
    const status = getQuoteCommercialStatus(q);
    const viewedAt = q.viewed_at || getLastQuoteEventDate(q.id, ['viewed']);
    const lastContactAt = getLastMessageDate(q.id) || getLastQuoteEventDate(q.id, ['whatsapp_opened','whatsapp_copied','manual_followup','email_sent','link_created']);
    return {
      ...q,
      totals,
      client: getClient(q.client_id),
      commercialStatus: status,
      viewedAt,
      lastContactAt,
      daysToExpire: daysBetween(q.valid_until),
      needsFollowup: quoteNeedsFollowup(q)
    };
  });

  const accepted = enriched.filter(q => q.status === 'accepted');
  const rejected = enriched.filter(q => q.status === 'rejected');
  const pending = enriched.filter(q => !['accepted','rejected','expired'].includes(q.status));
  const expired = enriched.filter(q => q.commercialStatus === 'expired');
  const expiringSoon = enriched.filter(q => isQuoteExpiringSoon(q, 7));
  const viewedNoResponse = enriched.filter(q => q.commercialStatus === 'viewed_no_response');
  const sentNotViewed = enriched.filter(q => q.commercialStatus === 'sent_not_viewed');
  const needsFollowup = enriched.filter(q => q.needsFollowup);
  const totalActionable = pending.reduce((sum, q) => sum + q.totals.total, 0);
  const totalAccepted = accepted.reduce((sum, q) => sum + q.totals.total, 0);
  const totalRejected = rejected.reduce((sum, q) => sum + q.totals.total, 0);
  const totalExpired = expired.reduce((sum, q) => sum + q.totals.total, 0);
  const decidedCount = accepted.length + rejected.length;
  const closeRate = decidedCount ? Math.round((accepted.length / decidedCount) * 100) : 0;

  return {
    quotes: enriched,
    accepted,
    rejected,
    pending,
    expired,
    expiringSoon,
    viewedNoResponse,
    sentNotViewed,
    needsFollowup,
    totalActionable,
    totalAccepted,
    totalRejected,
    totalExpired,
    closeRate
  };
}

function getTopClients(quotes = state.quotes) {
  const map = new Map();
  quotes.forEach(quote => {
    const client = getClient(quote.client_id);
    const key = quote.client_id || 'sin-cliente';
    const row = map.get(key) || { name: client?.name || 'Sin cliente', quotes: 0, total: 0, accepted: 0 };
    row.quotes += 1;
    row.total += quoteTotals(quote).total;
    if (quote.status === 'accepted') row.accepted += quoteTotals(quote).total;
    map.set(key, row);
  });
  return [...map.values()].sort((a, b) => b.total - a.total).slice(0, 8);
}

function getTopServices(quotes = state.quotes) {
  const map = new Map();
  quotes.forEach(quote => {
    (quote.items || []).forEach(item => {
      const key = String(item.description || 'Sin descripción').trim().toLowerCase();
      const row = map.get(key) || { name: item.description || 'Sin descripción', quantity: 0, quotes: new Set(), total: 0 };
      row.quantity += Number(item.quantity || 0);
      row.total += Number(item.total || 0);
      row.quotes.add(quote.id);
      map.set(key, row);
    });
  });
  return [...map.values()].map(row => ({ ...row, quotes: row.quotes.size })).sort((a, b) => b.total - a.total).slice(0, 8);
}

function renderDashboard() {
  const analytics = getCommercialAnalytics();
  const latest = [...analytics.quotes].sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || ''))).slice(0, 6);
  const topClients = getTopClients(analytics.quotes).slice(0, 5);
  const topServices = getTopServices(analytics.quotes).slice(0, 5);

  return `
    <div class="page-header">
      <div>
        <h1>Dashboard comercial</h1>
        <p>Seguimiento de oportunidades, vencimientos, tasa de cierre y montos por estado.</p>
      </div>
      <div class="header-actions">
        <button class="btn primary" data-route="quote-new">Nueva cotización</button>
        <button class="btn secondary" data-route="reports">Ver seguimiento</button>
      </div>
    </div>

    <section class="grid cols-4">
      <div class="card metric"><span>Cotizaciones</span><strong>${analytics.quotes.length}</strong></div>
      <div class="card metric"><span>Pendientes</span><strong>${analytics.pending.length}</strong></div>
      <div class="card metric"><span>Tasa de cierre</span><strong>${analytics.closeRate}%</strong></div>
      <div class="card metric"><span>Necesitan seguimiento</span><strong>${analytics.needsFollowup.length}</strong></div>
    </section>

    <section class="grid cols-4" style="margin-top:18px;">
      <div class="card metric"><span>Monto pendiente</span><strong>${money(analytics.totalActionable)}</strong></div>
      <div class="card metric"><span>Monto aceptado</span><strong>${money(analytics.totalAccepted)}</strong></div>
      <div class="card metric"><span>Monto rechazado</span><strong>${money(analytics.totalRejected)}</strong></div>
      <div class="card metric"><span>Monto vencido</span><strong>${money(analytics.totalExpired)}</strong></div>
    </section>

    ${renderCommercialAlerts(analytics)}
    ${renderUsageCard()}

    <section class="grid cols-2" style="margin-top:18px;">
      <div class="card">
        <h2>Top clientes por monto cotizado</h2>
        ${topClients.length ? renderTopClientsTable(topClients) : `<div class="empty">Todavía no hay clientes cotizados.</div>`}
      </div>
      <div class="card">
        <h2>Top servicios cotizados</h2>
        ${topServices.length ? renderTopServicesTable(topServices) : `<div class="empty">Todavía no hay servicios cotizados.</div>`}
      </div>
    </section>

    <section class="card" style="margin-top:18px;">
      <div class="page-header" style="margin-bottom:12px;">
        <div>
          <h2>Últimas cotizaciones</h2>
          <p>Vista rápida de estado comercial y próxima acción.</p>
        </div>
        <button class="btn secondary" data-route="reports">Abrir reporte completo</button>
      </div>
      ${latest.length ? renderAnalyticsQuoteTable(latest, true) : `<div class="empty">Todavía no tienes cotizaciones.</div>`}
    </section>
  `;
}

function renderCommercialAlerts(analytics) {
  const alerts = [];
  if (analytics.needsFollowup.length) alerts.push({ type: 'warning', title: `${analytics.needsFollowup.length} cotizaciones necesitan seguimiento`, detail: 'Prioriza vistas sin respuesta, enviadas sin ver o próximas a vencer.' });
  if (analytics.expiringSoon.length) alerts.push({ type: 'warning', title: `${analytics.expiringSoon.length} cotizaciones vencen pronto`, detail: 'Revisa vigencias dentro de los próximos 7 días.' });
  if (analytics.viewedNoResponse.length) alerts.push({ type: 'info', title: `${analytics.viewedNoResponse.length} cotizaciones fueron vistas sin respuesta`, detail: 'Buen momento para enviar seguimiento manual por WhatsApp.' });
  if (!alerts.length) alerts.push({ type: 'ok', title: 'No hay alertas comerciales críticas', detail: 'Las cotizaciones activas no requieren acción inmediata.' });

  return `
    <section class="grid cols-3" style="margin-top:18px;">
      ${alerts.slice(0, 3).map(alert => `
        <div class="card insight ${alert.type}">
          <strong>${escapeHtml(alert.title)}</strong>
          <span>${escapeHtml(alert.detail)}</span>
        </div>
      `).join('')}
    </section>
  `;
}

function renderTopClientsTable(rows) {
  return `
    <div class="table-wrap compact-table">
      <table>
        <thead><tr><th>Cliente</th><th>Cotizaciones</th><th>Total</th><th>Aceptado</th></tr></thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              <td><strong>${escapeHtml(row.name)}</strong></td>
              <td>${row.quotes}</td>
              <td>${money(row.total)}</td>
              <td>${money(row.accepted)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderTopServicesTable(rows) {
  return `
    <div class="table-wrap compact-table">
      <table>
        <thead><tr><th>Servicio</th><th>Cant.</th><th>Cotizaciones</th><th>Total</th></tr></thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              <td><strong>${escapeHtml(row.name)}</strong></td>
              <td>${Number(row.quantity || 0).toFixed(2)}</td>
              <td>${row.quotes}</td>
              <td>${money(row.total)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function reportFilters() {
  return state.reportFilters || { period: 'all', status: 'all', attention: 'all' };
}

function applyReportFilters(quotes, filters = reportFilters()) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const last30 = new Date(now.getTime() - 30 * 86400000);
  const last90 = new Date(now.getTime() - 90 * 86400000);

  return quotes.filter(quote => {
    const createdAt = safeDate(quote.created_at) || now;
    if (filters.period === 'month' && createdAt < startOfMonth) return false;
    if (filters.period === 'last30' && createdAt < last30) return false;
    if (filters.period === 'last90' && createdAt < last90) return false;

    if (filters.status !== 'all' && quote.commercialStatus !== filters.status && quote.status !== filters.status) return false;

    if (filters.attention === 'needs_followup' && !quote.needsFollowup) return false;
    if (filters.attention === 'viewed_no_response' && quote.commercialStatus !== 'viewed_no_response') return false;
    if (filters.attention === 'expiring' && !isQuoteExpiringSoon(quote, 7)) return false;
    if (filters.attention === 'expired' && quote.commercialStatus !== 'expired') return false;

    return true;
  });
}

function renderReports() {
  const analytics = getCommercialAnalytics();
  const filters = reportFilters();
  const filtered = applyReportFilters(analytics.quotes, filters).sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  const filteredTotal = filtered.reduce((sum, q) => sum + q.totals.total, 0);

  return `
    <div class="page-header">
      <div>
        <h1>Seguimiento comercial</h1>
        <p>Prioriza cotizaciones por estado, vigencia, respuesta del cliente y monto.</p>
      </div>
      <div class="header-actions">
        <button class="btn primary" data-route="quote-new">Nueva cotización</button>
        <button class="btn secondary" data-action="clear-report-filters">Limpiar filtros</button>
      </div>
    </div>

    <section class="grid cols-4">
      <div class="card metric"><span>Filtradas</span><strong>${filtered.length}</strong></div>
      <div class="card metric"><span>Monto filtrado</span><strong>${money(filteredTotal)}</strong></div>
      <div class="card metric"><span>Vistas sin respuesta</span><strong>${analytics.viewedNoResponse.length}</strong></div>
      <div class="card metric"><span>Vencen pronto</span><strong>${analytics.expiringSoon.length}</strong></div>
    </section>

    <section class="card" style="margin-top:18px;">
      <form data-form="report-filters" class="form-grid three">
        <div class="field"><label>Periodo</label>
          <select name="period">
            ${[
              ['all','Todo'], ['month','Este mes'], ['last30','Últimos 30 días'], ['last90','Últimos 90 días']
            ].map(([value, label]) => `<option value="${value}" ${filters.period === value ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Estado</label>
          <select name="status">
            ${[
              ['all','Todos'], ['draft','Borrador'], ['sent','Enviada'], ['sent_not_viewed','Enviada sin ver'], ['viewed_no_response','Vista sin respuesta'], ['accepted','Aceptada'], ['rejected','Rechazada'], ['expired','Vencida']
            ].map(([value, label]) => `<option value="${value}" ${filters.status === value ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Atención</label>
          <select name="attention">
            ${[
              ['all','Todas'], ['needs_followup','Necesitan seguimiento'], ['viewed_no_response','Vistas sin respuesta'], ['expiring','Por vencer'], ['expired','Vencidas']
            ].map(([value, label]) => `<option value="${value}" ${filters.attention === value ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
        </div>
        <button class="btn primary" type="submit">Aplicar filtros</button>
      </form>
    </section>

    <section class="grid cols-2" style="margin-top:18px;">
      <div class="card">
        <h2>Alertas de seguimiento</h2>
        ${renderReportAlertList(analytics)}
      </div>
      <div class="card">
        <h2>Embudo comercial</h2>
        ${renderPipelineSummary(analytics)}
      </div>
    </section>

    <section class="card" style="margin-top:18px;">
      <h2>Cotizaciones</h2>
      ${filtered.length ? renderAnalyticsQuoteTable(filtered) : `<div class="empty">No hay cotizaciones para los filtros seleccionados.</div>`}
    </section>
  `;
}

function renderReportAlertList(analytics) {
  const rows = [
    ['Necesitan seguimiento', analytics.needsFollowup.length, money(analytics.needsFollowup.reduce((sum, q) => sum + q.totals.total, 0))],
    ['Vistas sin respuesta', analytics.viewedNoResponse.length, money(analytics.viewedNoResponse.reduce((sum, q) => sum + q.totals.total, 0))],
    ['Enviadas sin ver', analytics.sentNotViewed.length, money(analytics.sentNotViewed.reduce((sum, q) => sum + q.totals.total, 0))],
    ['Por vencer', analytics.expiringSoon.length, money(analytics.expiringSoon.reduce((sum, q) => sum + q.totals.total, 0))],
    ['Vencidas', analytics.expired.length, money(analytics.expired.reduce((sum, q) => sum + q.totals.total, 0))]
  ];
  return `
    <div class="insight-list">
      ${rows.map(([label, count, amount]) => `
        <div class="insight-row"><span>${label}</span><strong>${count}</strong><em>${amount}</em></div>
      `).join('')}
    </div>
  `;
}

function renderPipelineSummary(analytics) {
  const rows = [
    ['Borrador', analytics.quotes.filter(q => q.status === 'draft').length],
    ['Enviadas', analytics.quotes.filter(q => q.status === 'sent').length],
    ['Vistas sin respuesta', analytics.viewedNoResponse.length],
    ['Aceptadas', analytics.accepted.length],
    ['Rechazadas', analytics.rejected.length],
    ['Vencidas', analytics.expired.length]
  ];
  const max = Math.max(1, ...rows.map(([, count]) => count));
  return `
    <div class="pipeline">
      ${rows.map(([label, count]) => `
        <div class="pipeline-row">
          <span>${label}</span>
          <div class="pipeline-bar"><i style="width:${Math.max(4, Math.round((count / max) * 100))}%"></i></div>
          <strong>${count}</strong>
        </div>
      `).join('')}
    </div>
  `;
}

function renderAnalyticsQuoteTable(quotes, compact = false) {
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Número</th><th>Cliente</th><th>Estado comercial</th><th>Total</th><th>Vigencia</th><th>Última actividad</th>${compact ? '' : '<th>Acciones</th>'}
          </tr>
        </thead>
        <tbody>
          ${quotes.map(quote => {
            const lastActivity = quote.lastContactAt || quote.viewedAt || quote.updated_at || quote.created_at;
            return `
              <tr class="${quote.needsFollowup ? 'row-warning' : ''}">
                <td><strong>${escapeHtml(quote.quote_number)}</strong>${quote.needsFollowup ? '<br><span class="help">Requiere seguimiento</span>' : ''}</td>
                <td>${escapeHtml(quote.client?.name || 'Sin cliente')}</td>
                <td>${commercialBadge(quote.commercialStatus)}</td>
                <td>${money(quote.totals.total)}</td>
                <td>${escapeHtml(quote.valid_until || '')}${quote.daysToExpire !== null ? `<br><span class="help">${quote.daysToExpire < 0 ? `Venció hace ${Math.abs(quote.daysToExpire)} día(s)` : `Faltan ${quote.daysToExpire} día(s)`}</span>` : ''}</td>
                <td>${lastActivity ? formatDateTime(lastActivity) : 'Sin actividad'}</td>
                ${compact ? '' : `
                  <td class="actions">
                    <button class="btn secondary small" data-route="quote-view/${quote.id}">Ver</button>
                    <button class="btn secondary small" data-action="open-whatsapp" data-id="${quote.id}">WhatsApp</button>
                    <button class="btn secondary small" data-action="manual-followup" data-id="${quote.id}">Registrar</button>
                  </td>
                `}
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}


function renderUsageCard() {
  const usage = getPlanUsage();
  return `
    <section class="card" style="margin-top:18px;">
      <div class="page-header" style="margin-bottom:12px;">
        <div>
          <h2>Uso mensual del plan</h2>
          <p>${escapeHtml(usage.plan.name)} permite ${usage.limit} cotizaciones al mes.</p>
        </div>
        <button class="btn secondary" data-route="billing">Ver planes</button>
      </div>
      <div class="usage-bar"><span style="width:${usage.percent}%"></span></div>
      <p class="help">Usadas este mes: <strong>${usage.used}</strong> / ${usage.limit}. Disponibles: ${usage.remaining}.</p>
    </section>
  `;
}

function renderQuotes() {
  return `
    <div class="page-header">
      <div>
        <h1>Cotizaciones</h1>
        <p>Crea, edita, marca estado y genera PDF.</p>
      </div>
      <button class="btn primary" data-route="quote-new">Nueva cotización</button>
    </div>
    <section class="card">
      ${state.quotes.length ? renderQuotesTable(state.quotes) : `<div class="empty">No hay cotizaciones. Crea la primera.</div>`}
    </section>
  `;
}

function renderQuotesTable(quotes, compact = false) {
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Número</th>
            <th>Cliente</th>
            <th>Estado</th>
            <th>Total</th>
            <th>Válida hasta</th>
            ${compact ? '' : '<th>Acciones</th>'}
          </tr>
        </thead>
        <tbody>
          ${quotes.map(quote => {
            const client = getClient(quote.client_id);
            const totals = quoteTotals(quote);
            return `
              <tr>
                <td><strong>${escapeHtml(quote.quote_number)}</strong></td>
                <td>${escapeHtml(client?.name || 'Sin cliente')}</td>
                <td>${statusBadge(quote.status)}</td>
                <td>${money(totals.total)}</td>
                <td>${escapeHtml(quote.valid_until || '')}</td>
                ${compact ? '' : `
                  <td class="actions">
                    <button class="btn secondary small" data-route="quote-view/${quote.id}">Ver</button>
                    <button class="btn secondary small" data-route="quote-edit/${quote.id}">Editar</button>
                    <button class="btn secondary small" data-action="pdf" data-id="${quote.id}">PDF</button>
                    <button class="btn danger small" data-action="delete-quote" data-id="${quote.id}">Borrar</button>
                  </td>
                `}
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderClients() {
  return `
    <div class="page-header">
      <div>
        <h1>Clientes</h1>
        <p>Base comercial simple para crear cotizaciones rápido.</p>
      </div>
    </div>

    <section class="grid cols-2">
      <div class="card">
        <h2>Nuevo cliente</h2>
        <form data-form="client" class="form-grid">
          <div class="field"><label>Nombre</label><input name="name" required placeholder="Cliente o empresa" /></div>
          <div class="field"><label>Correo</label><input name="email" type="email" placeholder="cliente@email.com" /></div>
          <div class="field"><label>Teléfono</label><input name="phone" placeholder="809-000-0000" /></div>
          <div class="field"><label>Dirección</label><textarea name="address" placeholder="Dirección comercial"></textarea></div>
          <button class="btn primary" type="submit">Guardar cliente</button>
        </form>
      </div>

      <div class="card">
        <h2>Lista de clientes</h2>
        ${state.clients.length ? `
          <div class="table-wrap">
            <table>
              <thead><tr><th>Cliente</th><th>Contacto</th><th>Acciones</th></tr></thead>
              <tbody>
                ${state.clients.map(client => `
                  <tr>
                    <td><strong>${escapeHtml(client.name)}</strong><br><span class="help">${escapeHtml(client.address || '')}</span></td>
                    <td>${escapeHtml(client.email || '')}<br><span class="help">${escapeHtml(client.phone || '')}</span></td>
                    <td><button class="btn danger small" data-action="delete-client" data-id="${client.id}">Borrar</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `<div class="empty">Todavía no tienes clientes.</div>`}
      </div>
    </section>
  `;
}


const BUSINESS_TYPES = [
  ['general', 'General / servicios'],
  ['taller', 'Taller'],
  ['camaras', 'Instalación de cámaras'],
  ['electricos', 'Técnicos eléctricos'],
  ['aires', 'Aires acondicionados'],
  ['imprenta', 'Imprenta'],
  ['carga', 'Agencia de carga'],
  ['suplidor', 'Suplidor']
];

function businessTypeLabel(value) {
  return (BUSINESS_TYPES.find(([key]) => key === value)?.[1]) || 'General / servicios';
}

function businessTypeOptions(selected = 'general') {
  return BUSINESS_TYPES.map(([key, label]) => `<option value="${key}" ${String(selected || 'general') === key ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('');
}

function activeProductsServices() {
  return (state.productsServices || []).filter(p => p.is_active !== false);
}

function renderCatalogPicker() {
  const products = activeProductsServices();
  if (!products.length) {
    return `
      <div class="notice warning">
        Todavía no tienes catálogo. Puedes crear items manuales o ir a <strong>Catálogo</strong> para cargar servicios frecuentes.
      </div>
    `;
  }

  return `
    <div class="catalog-picker">
      <div class="field">
        <label>Agregar desde catálogo</label>
        <select data-catalog-select>
          <option value="">Selecciona producto o servicio...</option>
          ${products.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml([item.category, item.name].filter(Boolean).join(' · '))} — ${money(item.unit_price)}</option>`).join('')}
        </select>
      </div>
      <button class="btn secondary" type="button" data-action="add-catalog-item">Agregar</button>
    </div>
  `;
}

function renderCatalog() {
  const usage = getPlanUsage();
  const products = activeProductsServices();
  const catalogLimit = Number(usage.plan.catalogLimit || 0);
  const reached = products.length >= catalogLimit;
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  return `
    <div class="page-header">
      <div>
        <h1>Catálogo</h1>
        <p>Servicios y productos frecuentes para crear cotizaciones más rápido.</p>
      </div>
      <div class="header-actions">
        <button class="btn secondary" data-action="seed-catalog">Cargar plantilla ${escapeHtml(businessTypeLabel(state.company?.business_type))}</button>
        <button class="btn secondary" data-route="quote-new">Nueva cotización</button>
      </div>
    </div>

    <section class="grid cols-3">
      <div class="card metric"><span>Items activos</span><strong>${products.length}</strong></div>
      <div class="card metric"><span>Límite del plan</span><strong>${catalogLimit}</strong></div>
      <div class="card metric"><span>Categorías</span><strong>${categories.length}</strong></div>
    </section>

    ${reached ? `<div class="notice warning" style="margin-top:18px;">Llegaste al límite de catálogo del plan ${escapeHtml(usage.plan.name)}: ${products.length}/${catalogLimit}. Sube de plan para agregar más.</div>` : ''}

    <section class="card" style="margin-top:18px;">
      <h2>Agregar producto / servicio</h2>
      <form data-form="product-service" class="form-grid three">
        <div class="field"><label>Nombre</label><input name="name" required placeholder="Instalación cámara IP" ${reached ? 'disabled' : ''} /></div>
        <div class="field"><label>Categoría</label><input name="category" placeholder="CCTV, Taller, Aire..." ${reached ? 'disabled' : ''} /></div>
        <div class="field"><label>Unidad</label>
          <select name="unit" ${reached ? 'disabled' : ''}>
            ${['servicio','unidad','hora','día','paquete','m2','m3','kg'].map(u => `<option value="${u}">${u}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Cantidad por defecto</label><input name="default_quantity" type="number" step="0.01" min="0" value="1" ${reached ? 'disabled' : ''} /></div>
        <div class="field"><label>Precio venta</label><input name="unit_price" type="number" step="0.01" min="0" value="0" ${reached ? 'disabled' : ''} /></div>
        <div class="field"><label>Costo interno opcional</label><input name="cost" type="number" step="0.01" min="0" value="0" ${reached ? 'disabled' : ''} /></div>
        <div class="field"><label>Impuesto % opcional</label><input name="tax_rate" type="number" step="0.01" min="0" value="${escapeHtml(state.company?.tax_rate || 0)}" ${reached ? 'disabled' : ''} /></div>
        <div class="field" style="grid-column:1/-1;"><label>Descripción para cotización</label><textarea name="description" placeholder="Descripción que se insertará en la cotización" ${reached ? 'disabled' : ''}></textarea></div>
        <button class="btn primary" type="submit" ${reached ? 'disabled' : ''}>Guardar en catálogo</button>
      </form>
    </section>

    <section class="card" style="margin-top:18px;">
      <h2>Productos y servicios</h2>
      ${products.length ? renderProductsServicesTable(products) : `<div class="empty">Todavía no tienes productos o servicios guardados.</div>`}
    </section>
  `;
}

function renderProductsServicesTable(products) {
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Nombre</th><th>Categoría</th><th>Unidad</th><th>Precio</th><th>Costo</th><th>Margen</th><th>Acciones</th></tr></thead>
        <tbody>
          ${products.map(item => {
            const price = Number(item.unit_price || 0);
            const cost = Number(item.cost || 0);
            const margin = price > 0 ? Math.round(((price - cost) / price) * 100) : 0;
            return `
              <tr>
                <td><strong>${escapeHtml(item.name)}</strong><br><span class="help">${escapeHtml(item.description || '')}</span></td>
                <td>${escapeHtml(item.category || '')}</td>
                <td>${escapeHtml(item.unit || 'servicio')}</td>
                <td>${money(price)}</td>
                <td>${cost ? money(cost) : '-'}</td>
                <td>${cost ? `${margin}%` : '-'}</td>
                <td><button class="btn danger small" data-action="delete-product-service" data-id="${item.id}">Desactivar</button></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderTemplates() {
  const templates = state.messageTemplates || [];
  const whatsapp = templates.filter(t => t.channel === 'whatsapp' && t.status === 'active');
  const email = templates.filter(t => t.channel === 'email' && t.status === 'active');
  return `
    <div class="page-header">
      <div>
        <h1>Plantillas</h1>
        <p>Mensajes reutilizables para WhatsApp manual, seguimiento y preparación futura de email.</p>
      </div>
    </div>

    <section class="grid cols-2">
      <div class="card metric"><span>WhatsApp</span><strong>${whatsapp.length}</strong></div>
      <div class="card metric"><span>Email preparado</span><strong>${email.length}</strong></div>
    </section>

    <section class="card" style="margin-top:18px;">
      <h2>Nueva plantilla</h2>
      <form data-form="message-template" class="form-grid two">
        <div class="field"><label>Canal</label><select name="channel"><option value="whatsapp">WhatsApp manual</option><option value="email">Email futuro</option></select></div>
        <div class="field"><label>Nombre</label><input name="name" required placeholder="Segundo seguimiento" /></div>
        <div class="field" style="grid-column:1/-1;"><label>Asunto email opcional</label><input name="subject" placeholder="Cotización {{quote_number}}" /></div>
        <div class="field" style="grid-column:1/-1;"><label>Cuerpo</label><textarea name="body" required placeholder="Hola {{client_name}}, te comparto la cotización {{quote_number}} por {{quote_total}}. {{public_link}}"></textarea></div>
        <p class="help" style="grid-column:1/-1;">Variables disponibles: <code>{{client_name}}</code>, <code>{{quote_number}}</code>, <code>{{quote_total}}</code>, <code>{{public_link}}</code>, <code>{{company_name}}</code>.</p>
        <button class="btn primary" type="submit">Guardar plantilla</button>
      </form>
    </section>

    <section class="card" style="margin-top:18px;">
      <h2>Plantillas activas</h2>
      ${templates.filter(t => t.status === 'active').length ? renderMessageTemplatesTable(templates.filter(t => t.status === 'active')) : `<div class="empty">No hay plantillas activas.</div>`}
    </section>
  `;
}

function renderMessageTemplatesTable(templates) {
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Canal</th><th>Nombre</th><th>Mensaje</th><th>Acciones</th></tr></thead>
        <tbody>
          ${templates.map(t => `
            <tr>
              <td>${escapeHtml(t.channel)}</td>
              <td><strong>${escapeHtml(t.name)}</strong>${t.subject ? `<br><span class="help">${escapeHtml(t.subject)}</span>` : ''}</td>
              <td>${escapeHtml(t.body || '').slice(0, 220)}${String(t.body || '').length > 220 ? '...' : ''}</td>
              <td><button class="btn danger small" data-action="delete-message-template" data-id="${t.id}">Desactivar</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderSettings() {
  const c = state.company || defaultCompany;
  return `
    <div class="page-header">
      <div>
        <h1>Empresa</h1>
        <p>Estos datos salen en tus cotizaciones y PDF.</p>
      </div>
    </div>

    <section class="card">
      <form data-form="company" class="form-grid two">
        <div class="field"><label>Nombre empresa</label><input name="name" value="${escapeHtml(c.name)}" required /></div>
        <div class="field"><label>RNC / Documento</label><input name="tax_id" value="${escapeHtml(c.tax_id)}" /></div>
        <div class="field"><label>Correo</label><input name="email" type="email" value="${escapeHtml(c.email)}" /></div>
        <div class="field"><label>Teléfono</label><input name="phone" value="${escapeHtml(c.phone)}" /></div>
        <div class="field"><label>Moneda</label>
          <select name="currency">
            ${['USD','DOP','EUR'].map(cur => `<option value="${cur}" ${c.currency === cur ? 'selected' : ''}>${cur}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Impuesto %</label><input name="tax_rate" type="number" step="0.01" min="0" value="${escapeHtml(c.tax_rate)}" /></div>
        <div class="field"><label>Tipo de negocio</label>
          <select name="business_type">
            ${businessTypeOptions(c.business_type)}
          </select>
        </div>
        <div class="field" style="grid-column:1/-1;"><label>Dirección</label><textarea name="address">${escapeHtml(c.address)}</textarea></div>
        <div class="field" style="grid-column:1/-1;"><label>Notas por defecto en cotizaciones</label><textarea name="default_quote_notes">${escapeHtml(c.default_quote_notes || defaultCompany.default_quote_notes)}</textarea></div>
        <div class="field" style="grid-column:1/-1;"><label>Términos y condiciones por defecto</label><textarea name="default_terms" placeholder="Opcional">${escapeHtml(c.default_terms || '')}</textarea></div>
        <div class="field" style="grid-column:1/-1;"><label>Mensaje WhatsApp por defecto</label><textarea name="default_whatsapp_template" placeholder="Usa variables: {{client_name}}, {{quote_number}}, {{quote_total}}, {{public_link}}, {{company_name}}">${escapeHtml(c.default_whatsapp_template || '')}</textarea></div>
        <button class="btn primary" type="submit">Guardar empresa</button>
      </form>
    </section>
  `;
}

function renderQuoteForm(id) {
  const quote = id ? state.quotes.find(q => q.id === id) : null;
  const editing = Boolean(quote);
  const current = quote || {
    id: '',
    quote_number: nextQuoteNumber(),
    client_id: state.clients[0]?.id || '',
    status: 'draft',
    currency: state.company?.currency || 'USD',
    tax_rate: state.company?.tax_rate || 0,
    valid_until: addDaysISO(15),
    notes: state.company?.default_quote_notes || defaultCompany.default_quote_notes,
    items: [{ id: uid('item'), description: '', quantity: 1, unit_price: 0, total: 0 }]
  };
  const limitReached = !editing && !canCreateQuote();
  const usage = getPlanUsage();

  return `
    <div class="page-header">
      <div>
        <h1>${editing ? 'Editar cotización' : 'Nueva cotización'}</h1>
        <p>${editing ? 'Actualiza la propuesta.' : 'Crea una cotización profesional.'}</p>
      </div>
      <button class="btn secondary" data-route="quotes">Volver</button>
    </div>

    ${state.clients.length ? '' : `<div class="notice warning">Primero debes crear un cliente para asociar la cotización.</div>`}
    ${limitReached ? `<div class="notice warning">Llegaste al límite del plan ${escapeHtml(usage.plan.name)}: ${usage.used}/${usage.limit} cotizaciones este mes. Sube de plan para crear más.</div>` : ''}

    <form data-form="quote" data-id="${escapeHtml(current.id)}" class="form-grid">
      <section class="card">
        <div class="form-grid three">
          <div class="field"><label>Número</label><input name="quote_number" value="${escapeHtml(current.quote_number)}" required /></div>
          <div class="field"><label>Cliente</label>
            <select name="client_id" required>
              ${state.clients.map(client => `<option value="${client.id}" ${current.client_id === client.id ? 'selected' : ''}>${escapeHtml(client.name)}</option>`).join('')}
            </select>
          </div>
          <div class="field"><label>Estado</label>
            <select name="status">
              ${['draft','sent','accepted','rejected','expired'].map(status => `<option value="${status}" ${current.status === status ? 'selected' : ''}>${statusLabel(status)}</option>`).join('')}
            </select>
          </div>
          <div class="field"><label>Válida hasta</label><input name="valid_until" type="date" value="${escapeHtml(current.valid_until)}" /></div>
          <div class="field"><label>Impuesto %</label><input name="tax_rate" type="number" step="0.01" min="0" value="${escapeHtml(current.tax_rate)}" /></div>
          <div class="field"><label>Moneda</label><input name="currency" value="${escapeHtml(current.currency)}" maxlength="3" /></div>
        </div>
      </section>

      <section class="card">
        <div class="page-header" style="margin-bottom:12px;">
          <h2>Items</h2>
          <button class="btn secondary small" type="button" data-action="add-item">Agregar item</button>
        </div>
        ${renderCatalogPicker()}
        <div id="items">
          ${(current.items || []).map(item => renderItemRow(item)).join('')}
        </div>
        <div class="summary-box">
          <div class="summary-line"><span>Subtotal</span><span id="subtotal-preview">${money(quoteTotals(current).subtotal)}</span></div>
          <div class="summary-line"><span>Impuesto</span><span id="tax-preview">${money(quoteTotals(current).tax)}</span></div>
          <div class="summary-line total"><span>Total</span><span id="total-preview">${money(quoteTotals(current).total)}</span></div>
        </div>
      </section>

      <section class="card">
        <div class="field"><label>Notas</label><textarea name="notes">${escapeHtml(current.notes || '')}</textarea></div>
      </section>

      <div class="header-actions">
        <button class="btn primary" type="submit" ${state.clients.length && !limitReached ? '' : 'disabled'}>Guardar cotización</button>
        ${editing ? `<button class="btn secondary" type="button" data-action="pdf" data-id="${current.id}">Generar PDF</button>` : ''}
      </div>
    </form>
  `;
}

function renderItemRow(item) {
  return `
    <div class="item-row" data-item-row>
      <div class="field"><label>Descripción</label><input name="item_description" value="${escapeHtml(item.description || '')}" placeholder="Servicio o producto" required /></div>
      <div class="field"><label>Cant.</label><input name="item_quantity" type="number" step="0.01" min="0" value="${escapeHtml(item.quantity ?? 1)}" required /></div>
      <div class="field"><label>Precio</label><input name="item_unit_price" type="number" step="0.01" min="0" value="${escapeHtml(item.unit_price ?? 0)}" required /></div>
      <div class="field"><label>Total</label><input name="item_total" type="number" step="0.01" value="${escapeHtml(item.total ?? 0)}" readonly /></div>
      <button class="btn danger small" type="button" data-action="remove-item">×</button>
    </div>
  `;
}

function renderQuoteView(id) {
  const quote = state.quotes.find(q => q.id === id);
  if (!quote) return `<div class="empty">Cotización no encontrada.</div>`;
  const client = getClient(quote.client_id);
  const totals = quoteTotals(quote);
  const publicLink = getActivePublicLink(quote.id);
  const publicUrl = publicLink?.token ? publicUrlFromToken(publicLink.token) : '';
  const message = whatsappMessage(quote, publicUrl);
  const events = getQuoteEvents(quote.id);
  const logs = getQuoteMessageLogs(quote.id);

  return `
    <div class="page-header">
      <div>
        <h1>${escapeHtml(quote.quote_number)}</h1>
        <p>${escapeHtml(client?.name || 'Sin cliente')} · ${statusBadge(quote.status)}</p>
      </div>
      <div class="header-actions">
        <button class="btn secondary" data-route="quotes">Volver</button>
        <button class="btn secondary" data-route="quote-edit/${quote.id}">Editar</button>
        <button class="btn primary" data-action="pdf" data-id="${quote.id}">PDF</button>
      </div>
    </div>

    <section class="card printable-quote">
      <div class="quote-preview-header">
        <div>
          <h2>${escapeHtml(state.company?.name || '')}</h2>
          <p class="help">${escapeHtml(state.company?.tax_id || '')} · ${escapeHtml(state.company?.email || '')} · ${escapeHtml(state.company?.phone || '')}</p>
        </div>
        <div style="text-align:right;">
          <h3>Cotización</h3>
          <strong>${escapeHtml(quote.quote_number)}</strong><br>
          <span class="help">Válida hasta ${escapeHtml(quote.valid_until || '')}</span>
        </div>
      </div>

      <div class="grid cols-2" style="margin-top:18px;">
        <div>
          <h3>Cliente</h3>
          <p><strong>${escapeHtml(client?.name || '')}</strong><br>${escapeHtml(client?.email || '')}<br>${escapeHtml(client?.phone || '')}</p>
        </div>
        <div>
          <h3>Estado</h3>
          ${statusBadge(quote.status)}
          ${quote.viewed_at ? `<p class="help">Visto: ${escapeHtml(formatDateTime(quote.viewed_at))}</p>` : ''}
          ${quote.accepted_at ? `<p class="help">Aceptada: ${escapeHtml(formatDateTime(quote.accepted_at))}</p>` : ''}
        </div>
      </div>

      <div class="table-wrap" style="margin-top:18px;">
        <table>
          <thead><tr><th>Descripción</th><th>Cant.</th><th>Precio</th><th>Total</th></tr></thead>
          <tbody>
            ${(quote.items || []).map(item => `
              <tr>
                <td>${escapeHtml(item.description)}</td>
                <td>${Number(item.quantity || 0)}</td>
                <td>${money(item.unit_price)}</td>
                <td>${money(item.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="summary-box" style="margin-top:18px;">
        <div class="summary-line"><span>Subtotal</span><span>${money(totals.subtotal)}</span></div>
        <div class="summary-line"><span>Impuesto</span><span>${money(totals.tax)}</span></div>
        <div class="summary-line total"><span>Total</span><span>${money(totals.total)}</span></div>
      </div>

      <p style="margin-top:24px;">${escapeHtml(quote.notes || '')}</p>
    </section>

    <section class="card" style="margin-top:18px;">
      <div class="page-header" style="margin-bottom:12px;">
        <div>
          <h2>Link público seguro</h2>
          <p>El cliente puede ver, aceptar o rechazar esta cotización sin iniciar sesión.</p>
        </div>
        <button class="btn primary" data-action="create-public-link" data-id="${quote.id}">
          ${publicLink ? 'Regenerar / obtener link' : 'Crear link público'}
        </button>
      </div>
      ${publicLink ? `
        <div class="copy-line"><input readonly value="${escapeHtml(publicUrl)}" /><button class="btn secondary" data-action="copy-public-link" data-id="${quote.id}">Copiar</button></div>
        <div class="header-actions" style="margin-top:12px;">
          <button class="btn secondary" data-action="open-public-link" data-id="${quote.id}">Abrir vista pública</button>
          <span class="help">Expira: ${escapeHtml(publicLink.expires_at ? formatDateTime(publicLink.expires_at) : 'sin expiración')}</span>
        </div>
      ` : `<div class="empty">Todavía no hay link público activo para esta cotización.</div>`}
    </section>

    <section class="card" style="margin-top:18px;">
      <h2>WhatsApp manual inteligente</h2>
      <p class="help">No usa WhatsApp API. Abre WhatsApp con mensaje prellenado y registra el intento de seguimiento.</p>
      <textarea class="copy-box" readonly>${escapeHtml(message)}</textarea>
      <div class="header-actions" style="margin-top:12px;">
        <button class="btn secondary" data-action="copy-whatsapp" data-id="${quote.id}">Copiar mensaje</button>
        <button class="btn primary" data-action="open-whatsapp" data-id="${quote.id}" ${client?.phone ? '' : 'disabled'}>Abrir WhatsApp</button>
        <button class="btn secondary" data-action="manual-followup" data-id="${quote.id}">Registrar seguimiento manual</button>
      </div>
    </section>

    <section class="grid cols-2" style="margin-top:18px;">
      <div class="card">
        <h2>Actividad</h2>
        ${events.length ? renderQuoteEvents(events) : `<div class="empty">Sin eventos todavía.</div>`}
      </div>
      <div class="card">
        <h2>Mensajes y seguimientos</h2>
        ${logs.length ? renderMessageLogs(logs) : `<div class="empty">Sin mensajes registrados todavía.</div>`}
      </div>
    </section>
  `;
}

function renderQuoteEvents(events) {
  return `
    <div class="timeline">
      ${events.map(event => `
        <div class="timeline-item">
          <strong>${escapeHtml(eventLabel(event.event_type))}</strong>
          <span>${escapeHtml(formatDateTime(event.created_at))}</span>
          ${event.comment ? `<p>${escapeHtml(event.comment)}</p>` : ''}
          ${event.actor_name || event.actor_email ? `<p class="help">${escapeHtml([event.actor_name, event.actor_email].filter(Boolean).join(' · '))}</p>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function renderMessageLogs(logs) {
  return `
    <div class="timeline">
      ${logs.map(log => `
        <div class="timeline-item">
          <strong>${escapeHtml(log.channel)} · ${escapeHtml(log.status)}</strong>
          <span>${escapeHtml(formatDateTime(log.sent_at || log.created_at))}</span>
          <p>${escapeHtml(log.message_body)}</p>
        </div>
      `).join('')}
    </div>
  `;
}

function renderIntegrations() {
  return `
    <div class="page-header">
      <div>
        <h1>Integraciones</h1>
        <p>Estado técnico de Fase 5: pagos, referidos, links públicos, catálogo y plantillas.</p>
      </div>
    </div>

    <section class="grid cols-2">
      <div class="card">
        <h2>Base de datos</h2>
        <p><strong>Estado:</strong> ${mode === 'supabase' ? 'Supabase conectado' : 'modo local'}</p>
        <p class="help">Ejecuta <code>supabase/schema_phase5.sql</code> después de Fase 4 para activar planes nuevos, catálogo y plantillas por tipo de negocio.</p>
      </div>
      <div class="card">
        <h2>Backend seguro</h2>
        <div class="bullets">
          <span><code>create-checkout</code> crea checkout con metadata segura.</span>
          <span><code>billing-webhook</code> procesa pagos y actualiza planes.</span>
          <span>Las secret keys quedan solo en Supabase Edge Functions.</span>
          <span>Resend queda pendiente para una fase posterior con dominio propio.</span>
        </div>
      </div>
    </section>
  `;
}

function renderBilling() {
  const usage = getPlanUsage();
  const provider = config.billingProvider || 'lemon_squeezy';
  return `
    <div class="page-header">
      <div>
        <h1>Planes y pagos</h1>
        <p>Control de suscripción, límites mensuales y checkout seguro.</p>
      </div>
    </div>

    ${renderUsageCard()}

    <section class="grid cols-3" style="margin-top:18px;">
      ${['starter','enterprise','custom'].map(planKey => renderPlanCard(planKey, usage.planKey, provider)).join('')}
    </section>

    <section class="card" style="margin-top:18px;">
      <h2>Estado de suscripción</h2>
      <p><strong>Plan efectivo:</strong> ${escapeHtml(usage.plan.name)}</p>
      <p><strong>Estado proveedor:</strong> ${escapeHtml(state.billing?.status || state.company?.subscription_status || 'inactive')}</p>
      <p><strong>Vigencia:</strong> ${escapeHtml(state.billing?.current_period_end || state.company?.plan_current_period_end || 'Sin periodo activo')}</p>
      <p class="help">El plan solo debe cambiar por webhook de pago o por actualización administrativa. El frontend no puede marcar una empresa como pagada.</p>
    </section>
  `;
}

function renderPlanCard(planKey, currentPlanKey, provider) {
  const plan = PLAN_CATALOG[planKey];
  const isCurrent = planKey === currentPlanKey;
  return `
    <div class="card plan-card ${isCurrent ? 'current' : ''}">
      <div class="plan-topline">${isCurrent ? 'Plan actual' : provider}</div>
      <h2>${escapeHtml(plan.name)}</h2>
      <div class="plan-price">${plan.price === null ? 'A cotizar' : `US$${plan.price}`}<span>${plan.price === null ? '' : '/mes'}</span></div>
      <p>${escapeHtml(plan.description)}</p>
      <div class="bullets">
        <span>${plan.quoteLimit} cotizaciones al mes.</span>
        <span>${plan.users} usuario${plan.users > 1 ? 's' : ''} incluido${plan.users > 1 ? 's' : ''}.</span>
        <span>${planKey === 'starter' ? 'PDF, links públicos y WhatsApp manual.' : planKey === 'enterprise' ? 'Plantillas, catálogo amplio y reportes.' : 'Volumen, usuarios e integraciones a medida.'}</span>
      </div>
      <button class="btn ${isCurrent ? 'secondary' : 'primary'} full" data-action="checkout" data-plan="${planKey}" ${isCurrent ? 'disabled' : ''}>
        ${isCurrent ? 'Activo' : plan.price === null ? 'Solicitar cotización' : 'Elegir plan'}
      </button>
    </div>
  `;
}

function renderAffiliates() {
  const affiliate = state.affiliate;
  const code = affiliate?.code || suggestAffiliateCode();
  const baseUrl = location.origin + location.pathname;
  const link = affiliate ? `${baseUrl}?ref=${encodeURIComponent(affiliate.code)}` : '';
  const pending = state.commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const available = state.commissions.filter(c => c.status === 'available').reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const paid = state.commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.amount || 0), 0);

  return `
    <div class="page-header">
      <div>
        <h1>Referidos</h1>
        <p>Programa de afiliados: 20% recurrente por 12 meses. Partners aprobados pueden llegar a 30%.</p>
      </div>
    </div>

    ${affiliate ? `
      <section class="grid cols-3">
        <div class="card metric"><span>Referidos</span><strong>${state.referrals.length}</strong></div>
        <div class="card metric"><span>Pendiente</span><strong>${money(pending)}</strong></div>
        <div class="card metric"><span>Disponible</span><strong>${money(available)}</strong></div>
      </section>

      <section class="card" style="margin-top:18px;">
        <h2>Tu link de referido</h2>
        <div class="copy-line"><input readonly value="${escapeHtml(link)}" /><button class="btn secondary" data-action="copy-affiliate-link">Copiar</button></div>
        <p class="help">Comisión: ${(Number(affiliate.commission_rate || 0.2) * 100).toFixed(0)}% durante ${affiliate.commission_months || 12} meses. Disponible 30 días después del pago confirmado.</p>
      </section>

      <section class="card" style="margin-top:18px;">
        <h2>Comisiones</h2>
        ${state.commissions.length ? renderCommissionsTable() : `<div class="empty">Todavía no hay comisiones generadas.</div>`}
        <p class="help" style="margin-top:12px;">Pagado histórico: ${money(paid)}. Los payouts siguen manuales en el MVP.</p>
      </section>
    ` : `
      <section class="card">
        <h2>Activar afiliado</h2>
        <form data-form="affiliate" class="form-grid two">
          <div class="field"><label>Código</label><input name="code" value="${escapeHtml(code)}" maxlength="24" required /></div>
          <div class="field"><label>Email de pago</label><input name="payout_email" type="email" placeholder="tu@email.com" /></div>
          <button class="btn primary" type="submit">Crear código de afiliado</button>
        </form>
        <p class="help">El código queda único. La comisión normal se crea en 20%; subir a Partner 30% se hace manualmente desde Supabase.</p>
      </section>
    `}
  `;
}

function renderCommissionsTable() {
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Fecha</th><th>Monto</th><th>Estado</th><th>Disponible</th></tr></thead>
        <tbody>
          ${state.commissions.map(c => `
            <tr>
              <td>${escapeHtml((c.created_at || '').slice(0, 10))}</td>
              <td>${money(c.amount)}</td>
              <td>${escapeHtml(c.status)}</td>
              <td>${escapeHtml((c.available_at || '').slice(0, 10))}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function suggestAffiliateCode() {
  const emailPrefix = String(state.session?.email || 'partner').split('@')[0];
  return sanitizeReferralCode(emailPrefix).slice(0, 16) || `CF${Date.now().toString().slice(-6)}`;
}


async function handleAuth(form) {
  if (mode !== 'supabase') {
    toast('Configura Supabase para usar autenticación real.');
    return;
  }
  const formData = new FormData(form);
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  const name = String(formData.get('name') || '').trim();
  state.authMessage = '';

  try {
    state.loading = true;
    render();

    let authResult;
    if (state.activeAuthTab === 'register') {
      authResult = await supabaseClient.auth.signUp({
        email,
        password,
        options: { data: { full_name: name || email } }
      });
    } else {
      authResult = await supabaseClient.auth.signInWithPassword({ email, password });
    }

    const { data, error } = authResult;
    if (error) throw error;

    if (!data?.session?.user) {
      state.loading = false;
      state.authMessage = 'Cuenta creada. Revisa tu correo si Supabase requiere confirmación antes de entrar.';
      render();
      return;
    }

    state.session = normalizeSession(data.session.user);
    await loadRemoteData();
    setRoute('dashboard');
  } catch (error) {
    state.loading = false;
    state.authMessage = error.message || 'No se pudo autenticar.';
    render();
  }
}

function startDemo() {
  mode = 'local';
  const local = loadLocalState();
  state = {
    ...state,
    ...local,
    loading: false,
    session: local.session || {
      id: 'local-demo-user',
      email: 'demo@cotizaflow.local',
      name: 'Usuario Demo',
      provider: 'local'
    },
    company: local.company || { ...defaultCompany },
    authMessage: ''
  };
  saveLocalState();
  setRoute('dashboard');
  render();
}

async function logout() {
  if (mode === 'supabase' && supabaseClient) await supabaseClient.auth.signOut();
  state.session = null;
  saveLocalState();
  setRoute('home');
  render();
}

async function saveCompany(form) {
  const fd = new FormData(form);
  const payload = {
    name: String(fd.get('name') || '').trim(),
    tax_id: String(fd.get('tax_id') || '').trim(),
    email: String(fd.get('email') || '').trim(),
    phone: String(fd.get('phone') || '').trim(),
    address: String(fd.get('address') || '').trim(),
    currency: String(fd.get('currency') || 'USD').trim().toUpperCase(),
    tax_rate: Number(fd.get('tax_rate') || 0),
    business_type: String(fd.get('business_type') || 'general').trim(),
    default_quote_notes: String(fd.get('default_quote_notes') || '').trim(),
    default_terms: String(fd.get('default_terms') || '').trim(),
    default_whatsapp_template: String(fd.get('default_whatsapp_template') || '').trim()
  };

  if (mode === 'supabase') {
    const { data, error } = await supabaseClient
      .from('companies')
      .update(payload)
      .eq('id', state.company.id)
      .select('*')
      .single();
    if (error) throw error;
    state.company = normalizeCompany(data);
  } else {
    state.company = { ...state.company, ...payload };
    saveLocalState();
  }
  toast('Empresa guardada.');
  render();
}

async function saveClient(form) {
  const fd = new FormData(form);
  const payload = {
    company_id: state.company.id,
    name: String(fd.get('name') || '').trim(),
    email: String(fd.get('email') || '').trim(),
    phone: String(fd.get('phone') || '').trim(),
    address: String(fd.get('address') || '').trim()
  };

  if (mode === 'supabase') {
    const { data, error } = await supabaseClient.from('clients').insert(payload).select('*').single();
    if (error) throw error;
    state.clients.unshift(data);
  } else {
    state.clients.unshift({ ...payload, id: uid('client'), created_at: new Date().toISOString() });
    saveLocalState();
  }
  form.reset();
  toast('Cliente guardado.');
  render();
}

async function deleteClient(id) {
  const hasQuotes = state.quotes.some(q => q.client_id === id);
  if (hasQuotes) {
    toast('No puedes borrar un cliente con cotizaciones asociadas.');
    return;
  }

  if (mode === 'supabase') {
    const { error } = await supabaseClient.from('clients').delete().eq('id', id);
    if (error) throw error;
  }
  state.clients = state.clients.filter(c => c.id !== id);
  saveLocalState();
  toast('Cliente eliminado.');
  render();
}

function collectQuoteForm(form) {
  const fd = new FormData(form);
  const id = form.dataset.id || '';
  const rows = [...form.querySelectorAll('[data-item-row]')];
  const items = rows.map((row, index) => {
    const description = row.querySelector('[name="item_description"]').value.trim();
    const quantity = Number(row.querySelector('[name="item_quantity"]').value || 0);
    const unit_price = Number(row.querySelector('[name="item_unit_price"]').value || 0);
    const total = quantity * unit_price;
    return { id: uid('item'), description, quantity, unit_price, total, position: index };
  }).filter(item => item.description);

  return {
    id,
    quote_number: String(fd.get('quote_number') || '').trim(),
    client_id: String(fd.get('client_id') || ''),
    status: String(fd.get('status') || 'draft'),
    valid_until: String(fd.get('valid_until') || ''),
    tax_rate: Number(fd.get('tax_rate') || 0),
    currency: String(fd.get('currency') || state.company.currency || 'USD').trim().toUpperCase(),
    notes: String(fd.get('notes') || '').trim(),
    items
  };
}

async function saveQuote(form) {
  const quote = collectQuoteForm(form);
  const existingQuote = quote.id ? state.quotes.find(q => q.id === quote.id) : null;
  if (!quote.items.length) {
    toast('Agrega al menos un item con descripción.');
    return;
  }
  if (!quote.id && !canCreateQuote()) {
    toast('Llegaste al límite mensual de tu plan.');
    setRoute('billing');
    render();
    return;
  }

  if (mode === 'supabase') {
    const quotePayload = {
      company_id: state.company.id,
      client_id: quote.client_id,
      quote_number: quote.quote_number,
      status: quote.status,
      currency: quote.currency,
      tax_rate: quote.tax_rate,
      valid_until: quote.valid_until || null,
      notes: quote.notes,
      sent_at: existingQuote?.sent_at || (quote.status === 'sent' ? new Date().toISOString() : null),
      accepted_at: existingQuote?.accepted_at || (quote.status === 'accepted' ? new Date().toISOString() : null),
      updated_at: new Date().toISOString()
    };

    let saved;
    if (quote.id) {
      const { data, error } = await supabaseClient
        .from('quotes')
        .update(quotePayload)
        .eq('id', quote.id)
        .select('*')
        .single();
      if (error) throw error;
      saved = data;
      const { error: deleteError } = await supabaseClient.from('quote_items').delete().eq('quote_id', quote.id);
      if (deleteError) throw deleteError;
    } else {
      const { data, error } = await supabaseClient
        .from('quotes')
        .insert({ ...quotePayload, public_token: uid('public') })
        .select('*')
        .single();
      if (error) throw error;
      saved = data;
    }

    const itemsPayload = quote.items.map((item, index) => ({
      quote_id: saved.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
      position: index
    }));
    const { error: itemsError } = await supabaseClient.from('quote_items').insert(itemsPayload);
    if (itemsError) throw itemsError;
    await loadRemoteData();
    setRoute(`quote-view/${saved.id}`);
    return;
  }

  if (quote.id) {
    state.quotes = state.quotes.map(q => q.id === quote.id ? { ...q, ...quote, sent_at: q.sent_at || (quote.status === 'sent' ? new Date().toISOString() : null), accepted_at: q.accepted_at || (quote.status === 'accepted' ? new Date().toISOString() : null), updated_at: new Date().toISOString() } : q);
  } else {
    state.quotes.unshift({
      ...quote,
      id: uid('quote'),
      company_id: state.company.id || 'local-company',
      public_token: uid('public'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
  saveLocalState();
  toast('Cotización guardada.');
  const savedId = quote.id || state.quotes[0].id;
  setRoute(`quote-view/${savedId}`);
  render();
}

async function deleteQuote(id) {
  if (!confirm('¿Borrar esta cotización?')) return;
  if (mode === 'supabase') {
    const { error } = await supabaseClient.from('quotes').delete().eq('id', id);
    if (error) throw error;
  }
  state.quotes = state.quotes.filter(q => q.id !== id);
  saveLocalState();
  toast('Cotización eliminada.');
  render();
}

function recalcQuoteForm() {
  const form = document.querySelector('[data-form="quote"]');
  if (!form) return;
  let subtotal = 0;
  form.querySelectorAll('[data-item-row]').forEach(row => {
    const qty = Number(row.querySelector('[name="item_quantity"]').value || 0);
    const price = Number(row.querySelector('[name="item_unit_price"]').value || 0);
    const total = qty * price;
    row.querySelector('[name="item_total"]').value = total.toFixed(2);
    subtotal += total;
  });
  const taxRate = Number(form.querySelector('[name="tax_rate"]').value || 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  const subtotalEl = document.getElementById('subtotal-preview');
  const taxEl = document.getElementById('tax-preview');
  const totalEl = document.getElementById('total-preview');
  if (subtotalEl) subtotalEl.textContent = money(subtotal);
  if (taxEl) taxEl.textContent = money(tax);
  if (totalEl) totalEl.textContent = money(total);
}

function addItemRow() {
  const container = document.getElementById('items');
  if (!container) return;
  container.insertAdjacentHTML('beforeend', renderItemRow({ description: '', quantity: 1, unit_price: 0, total: 0 }));
  recalcQuoteForm();
}

function removeItemRow(button) {
  const rows = document.querySelectorAll('[data-item-row]');
  if (rows.length <= 1) {
    toast('Debe quedar al menos un item.');
    return;
  }
  button.closest('[data-item-row]').remove();
  recalcQuoteForm();
}

function whatsappMessage(quote, publicUrl = '') {
  const client = getClient(quote.client_id);
  if (state.company?.default_whatsapp_template) return applyTemplate(state.company.default_whatsapp_template, quote, publicUrl);
  const template = getTemplate('whatsapp', publicUrl ? 'Enviar cotización' : 'Primer seguimiento');
  if (template?.body) return applyTemplate(template.body, quote, publicUrl);
  const totals = quoteTotals(quote);
  const linkText = publicUrl ? ` Puedes verla aquí: ${publicUrl}` : '';
  return `Hola ${client?.name || ''}, te compartimos la cotización ${quote.quote_number} por un total de ${money(totals.total)}. Vigencia: ${quote.valid_until || 'no especificada'}.${linkText} Quedamos atentos a tu confirmación.`;
}

async function createPublicQuoteLink(id) {
  if (mode !== 'supabase') {
    toast('Los links públicos seguros requieren Supabase.');
    return;
  }
  const { data, error } = await supabaseClient.functions.invoke('create-public-quote-link', {
    body: { quote_id: id, expires_days: 30 }
  });
  if (error) throw error;
  if (!data?.url) throw new Error('No se pudo generar el link público.');
  await navigator.clipboard.writeText(data.url).catch(() => {});
  await loadRemoteData();
  setRoute(`quote-view/${id}`);
  toast(data.reused ? 'Link público copiado.' : 'Link público creado y copiado.');
}

async function copyPublicLink(id) {
  const link = getActivePublicLink(id);
  if (!link?.token) {
    toast('Primero crea el link público.');
    return;
  }
  await navigator.clipboard.writeText(publicUrlFromToken(link.token));
  toast('Link público copiado.');
}

function openPublicLink(id) {
  const link = getActivePublicLink(id);
  if (!link?.token) {
    toast('Primero crea el link público.');
    return;
  }
  window.open(publicUrlFromToken(link.token), '_blank', 'noopener,noreferrer');
}

async function logQuoteEvent(quote, eventType, extra = {}) {
  if (mode !== 'supabase') return;
  const { error } = await supabaseClient.from('quote_events').insert({
    company_id: state.company.id,
    quote_id: quote.id,
    public_link_id: getActivePublicLink(quote.id)?.id || null,
    event_type: eventType,
    comment: extra.comment || null,
    metadata: extra.metadata || {}
  });
  if (error) throw error;
}

async function logMessage(quote, channel, body, status = 'manual') {
  if (mode !== 'supabase') return;
  const { error } = await supabaseClient.from('message_logs').insert({
    company_id: state.company.id,
    quote_id: quote.id,
    client_id: quote.client_id || null,
    channel,
    direction: 'outbound',
    message_body: body,
    status,
    sent_at: new Date().toISOString(),
    metadata: { source: 'cotizaflow-ui' }
  });
  if (error) throw error;
}

async function copyWhatsapp(id) {
  const quote = state.quotes.find(q => q.id === id);
  if (!quote) return;
  const link = getActivePublicLink(quote.id);
  const message = whatsappMessage(quote, link?.token ? publicUrlFromToken(link.token) : '');
  await navigator.clipboard.writeText(message);
  if (mode === 'supabase') {
    await logQuoteEvent(quote, 'whatsapp_copied');
    await logMessage(quote, 'whatsapp', message, 'manual');
    await loadRemoteData();
    setRoute(`quote-view/${id}`);
  }
  toast('Mensaje copiado.');
}

async function openWhatsapp(id) {
  const quote = state.quotes.find(q => q.id === id);
  if (!quote) return;
  const client = getClient(quote.client_id);
  if (!client?.phone) {
    toast('El cliente no tiene teléfono.');
    return;
  }
  const link = getActivePublicLink(quote.id);
  const message = whatsappMessage(quote, link?.token ? publicUrlFromToken(link.token) : '');
  const phone = String(client.phone || '').replace(/[^0-9]/g, '');
  if (mode === 'supabase') {
    await logQuoteEvent(quote, 'whatsapp_opened');
    await logMessage(quote, 'whatsapp', message, 'manual');
  }
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  if (mode === 'supabase') {
    await loadRemoteData();
    setRoute(`quote-view/${id}`);
  }
}

async function manualFollowup(id) {
  const quote = state.quotes.find(q => q.id === id);
  if (!quote) return;
  const link = getActivePublicLink(quote.id);
  const message = whatsappMessage(quote, link?.token ? publicUrlFromToken(link.token) : '');
  const comment = prompt('Nota del seguimiento manual:', 'Se dio seguimiento por WhatsApp / llamada.');
  if (comment === null) return;
  if (mode === 'supabase') {
    await logQuoteEvent(quote, 'manual_followup', { comment });
    await logMessage(quote, 'internal', comment || message, 'manual');
    await loadRemoteData();
    setRoute(`quote-view/${id}`);
  }
  toast('Seguimiento registrado.');
}



function addCatalogItemToQuote() {
  const select = document.querySelector('[data-catalog-select]');
  const productId = select?.value;
  if (!productId) {
    toast('Selecciona un producto o servicio del catálogo.');
    return;
  }
  const product = activeProductsServices().find(p => p.id === productId);
  if (!product) {
    toast('Producto no encontrado.');
    return;
  }
  const description = product.description || product.name;
  const quantity = Number(product.default_quantity || 1);
  const unit_price = Number(product.unit_price || 0);
  const total = quantity * unit_price;
  const container = document.getElementById('items');
  if (!container) return;
  container.insertAdjacentHTML('beforeend', renderItemRow({ description, quantity, unit_price, total }));
  recalcQuoteForm();
  select.value = '';
  toast('Item agregado desde catálogo.');
}

async function saveProductService(form) {
  const usage = getPlanUsage();
  const limit = Number(usage.plan.catalogLimit || 0);
  if (activeProductsServices().length >= limit) {
    toast(`Llegaste al límite de catálogo del plan ${usage.plan.name}.`);
    return;
  }
  const fd = new FormData(form);
  const payload = {
    company_id: state.company.id,
    name: String(fd.get('name') || '').trim(),
    description: String(fd.get('description') || '').trim(),
    category: String(fd.get('category') || '').trim(),
    unit: String(fd.get('unit') || 'servicio').trim(),
    default_quantity: Number(fd.get('default_quantity') || 1),
    unit_price: Number(fd.get('unit_price') || 0),
    cost: Number(fd.get('cost') || 0),
    tax_rate: Number(fd.get('tax_rate') || 0),
    is_active: true
  };
  if (!payload.name) {
    toast('El nombre es obligatorio.');
    return;
  }

  if (mode === 'supabase') {
    const { error } = await supabaseClient.from('products_services').insert(payload);
    if (error) throw error;
    await loadRemoteData();
  } else {
    state.productsServices.unshift({ ...payload, id: uid('prod'), created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    saveLocalState();
    render();
  }
  form.reset();
  toast('Producto/servicio guardado.');
  setRoute('catalog');
}

async function deleteProductService(id) {
  if (!confirm('¿Desactivar este producto o servicio del catálogo?')) return;
  if (mode === 'supabase') {
    const { error } = await supabaseClient.from('products_services').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    await loadRemoteData();
  } else {
    state.productsServices = state.productsServices.map(p => p.id === id ? { ...p, is_active: false } : p);
    saveLocalState();
    render();
  }
  setRoute('catalog');
  toast('Item desactivado.');
}

async function seedCatalogForBusinessType() {
  const businessType = state.company?.business_type || 'general';
  if (mode === 'supabase') {
    const { error } = await supabaseClient.rpc('seed_catalog_for_business_type', {
      target_company_id: state.company.id,
      selected_business_type: businessType
    });
    if (error) throw error;
    await loadRemoteData();
  } else {
    const seeds = (state.businessTemplates || []).filter(t => t.business_type === businessType || t.business_type === 'general');
    seeds.forEach(t => {
      if (!state.productsServices.some(p => p.name === t.name)) {
        state.productsServices.unshift({
          id: uid('prod'),
          company_id: state.company.id || 'local-company',
          name: t.name,
          description: t.description || '',
          category: t.category || '',
          unit: t.unit || 'servicio',
          default_quantity: 1,
          unit_price: Number(t.unit_price || 0),
          cost: 0,
          tax_rate: Number(state.company?.tax_rate || 0),
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    });
    saveLocalState();
    render();
  }
  setRoute('catalog');
  toast('Catálogo base cargado.');
}

async function saveMessageTemplate(form) {
  const fd = new FormData(form);
  const payload = {
    company_id: state.company.id,
    channel: String(fd.get('channel') || 'whatsapp'),
    name: String(fd.get('name') || '').trim(),
    subject: String(fd.get('subject') || '').trim() || null,
    body: String(fd.get('body') || '').trim(),
    status: 'active'
  };
  if (!payload.name || !payload.body) {
    toast('Nombre y cuerpo son obligatorios.');
    return;
  }

  if (mode === 'supabase') {
    const { error } = await supabaseClient.from('message_templates').upsert(payload, { onConflict: 'company_id,channel,name' });
    if (error) throw error;
    await loadRemoteData();
  } else {
    const existing = state.messageTemplates.find(t => t.channel === payload.channel && t.name === payload.name);
    if (existing) Object.assign(existing, payload, { updated_at: new Date().toISOString() });
    else state.messageTemplates.unshift({ ...payload, id: uid('tmpl'), created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    saveLocalState();
    render();
  }
  form.reset();
  setRoute('templates');
  toast('Plantilla guardada.');
}

async function deleteMessageTemplate(id) {
  if (!confirm('¿Desactivar esta plantilla?')) return;
  if (mode === 'supabase') {
    const { error } = await supabaseClient.from('message_templates').update({ status: 'inactive', updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    await loadRemoteData();
  } else {
    state.messageTemplates = state.messageTemplates.map(t => t.id === id ? { ...t, status: 'inactive' } : t);
    saveLocalState();
    render();
  }
  setRoute('templates');
  toast('Plantilla desactivada.');
}

function generatePdf(id) {
  const quote = state.quotes.find(q => q.id === id);
  if (!quote) return;
  if (!window.jspdf?.jsPDF) {
    toast('jsPDF no está disponible. Revisa tu conexión.');
    return;
  }

  const client = getClient(quote.client_id);
  const totals = quoteTotals(quote);
  const doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'letter' });
  const left = 44;
  let y = 48;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(state.company?.name || 'CotizaFlow', left, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  y += 16;
  doc.text(`${state.company?.tax_id || ''}  ${state.company?.email || ''}  ${state.company?.phone || ''}`, left, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('COTIZACIÓN', 420, 48);
  doc.setFontSize(10);
  doc.text(quote.quote_number || '', 420, 65);
  doc.setFont('helvetica', 'normal');
  doc.text(`Estado: ${statusLabel(quote.status)}`, 420, 82);
  doc.text(`Válida hasta: ${quote.valid_until || ''}`, 420, 99);

  y = 124;
  doc.setDrawColor(220);
  doc.line(left, y, 568, y);
  y += 28;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Cliente', left, y);
  doc.setFont('helvetica', 'normal');
  y += 16;
  doc.text(client?.name || '', left, y);
  y += 14;
  doc.text(client?.email || '', left, y);
  y += 14;
  doc.text(client?.phone || '', left, y);

  y += 28;
  doc.setFont('helvetica', 'bold');
  doc.text('Descripción', left, y);
  doc.text('Cant.', 350, y);
  doc.text('Precio', 410, y);
  doc.text('Total', 500, y);
  y += 8;
  doc.line(left, y, 568, y);
  y += 18;

  doc.setFont('helvetica', 'normal');
  (quote.items || []).forEach(item => {
    const description = doc.splitTextToSize(item.description || '', 285);
    doc.text(description, left, y);
    doc.text(String(Number(item.quantity || 0)), 350, y);
    doc.text(money(item.unit_price), 410, y);
    doc.text(money(item.total), 500, y);
    y += Math.max(18, description.length * 12 + 8);
    if (y > 680) {
      doc.addPage();
      y = 48;
    }
  });

  y += 8;
  doc.line(360, y, 568, y);
  y += 18;
  doc.text('Subtotal', 410, y);
  doc.text(money(totals.subtotal), 500, y);
  y += 16;
  doc.text('Impuesto', 410, y);
  doc.text(money(totals.tax), 500, y);
  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.text('Total', 410, y);
  doc.text(money(totals.total), 500, y);

  y += 34;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const notes = doc.splitTextToSize(quote.notes || '', 500);
  doc.text(notes, left, y);

  doc.save(`${quote.quote_number || 'cotizacion'}.pdf`);
}


async function startCheckout(planKey) {
  if (planKey === 'custom') {
    const subject = encodeURIComponent('CotizaFlow - plan a cotizar');
    const body = encodeURIComponent(`Hola, deseo cotizar un plan para ${state.company?.name || 'mi empresa'}. Necesito más de 500 cotizaciones o condiciones especiales.`);
    window.location.href = `mailto:${config.salesEmail || 'ventas@cotizaflow.app'}?subject=${subject}&body=${body}`;
    return;
  }
  if (mode !== 'supabase') {
    toast('Publica y entra con Supabase antes de cobrar planes reales.');
    return;
  }
  if (!PLAN_CATALOG[planKey] || ['free', 'custom'].includes(planKey)) {
    toast('Plan inválido.');
    return;
  }
  const { data, error } = await supabaseClient.functions.invoke('create-checkout', {
    body: { plan: planKey, referral_code: getPendingReferralCode() }
  });
  if (error) throw error;
  if (!data?.url) throw new Error('El backend no devolvió URL de checkout. Revisa variables de Lemon Squeezy.');
  window.location.href = data.url;
}

async function saveAffiliate(form) {
  if (mode !== 'supabase') {
    toast('Los referidos reales requieren Supabase.');
    return;
  }
  const fd = new FormData(form);
  const requested_code = sanitizeReferralCode(fd.get('code'));
  const payout_email = String(fd.get('payout_email') || '').trim();
  const { error } = await supabaseClient.rpc('create_my_affiliate', { requested_code, payout_email });
  if (error) throw error;
  await loadRemoteData();
  setRoute('affiliates');
  toast('Afiliado creado.');
}

async function copyAffiliateLink() {
  if (!state.affiliate?.code) return;
  const link = `${location.origin}${location.pathname}?ref=${encodeURIComponent(state.affiliate.code)}`;
  await navigator.clipboard.writeText(link);
  toast('Link de referido copiado.');
}


function handleReportFilters(form) {
  const fd = new FormData(form);
  state.reportFilters = {
    period: String(fd.get('period') || 'all'),
    status: String(fd.get('status') || 'all'),
    attention: String(fd.get('attention') || 'all')
  };
  saveLocalState();
  setRoute('reports');
  render();
}

app.addEventListener('click', async (event) => {
  const route = event.target.closest('[data-route]')?.dataset.route;
  const actionEl = event.target.closest('[data-action]');
  const authTab = event.target.closest('[data-auth-tab]')?.dataset.authTab;

  if (route) {
    setRoute(route);
    render();
    return;
  }

  if (authTab) {
    state.activeAuthTab = authTab;
    render();
    return;
  }

  if (!actionEl) return;
  const action = actionEl.dataset.action;
  const id = actionEl.dataset.id;
  const plan = actionEl.dataset.plan;

  try {
    if (action === 'start-demo') startDemo();
    if (action === 'logout') await logout();
    if (action === 'add-item') addItemRow();
    if (action === 'remove-item') removeItemRow(actionEl);
    if (action === 'delete-client') await deleteClient(id);
    if (action === 'delete-quote') await deleteQuote(id);
    if (action === 'pdf') generatePdf(id);
    if (action === 'copy-whatsapp') await copyWhatsapp(id);
    if (action === 'open-whatsapp') await openWhatsapp(id);
    if (action === 'manual-followup') await manualFollowup(id);
    if (action === 'create-public-link') await createPublicQuoteLink(id);
    if (action === 'copy-public-link') await copyPublicLink(id);
    if (action === 'open-public-link') openPublicLink(id);
    if (action === 'checkout') await startCheckout(plan);
    if (action === 'copy-affiliate-link') await copyAffiliateLink();
    if (action === 'add-catalog-item') addCatalogItemToQuote();
    if (action === 'delete-product-service') await deleteProductService(id);
    if (action === 'seed-catalog') await seedCatalogForBusinessType();
    if (action === 'delete-message-template') await deleteMessageTemplate(id);
    if (action === 'clear-report-filters') { state.reportFilters = { period: 'all', status: 'all', attention: 'all' }; saveLocalState(); setRoute('reports'); render(); }
  } catch (error) {
    console.error(error);
    toast(error.message || 'Ocurrió un error.');
  }
});

app.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  const type = form.dataset.form;
  try {
    if (type === 'auth') await handleAuth(form);
    if (type === 'company') await saveCompany(form);
    if (type === 'client') await saveClient(form);
    if (type === 'quote') await saveQuote(form);
    if (type === 'affiliate') await saveAffiliate(form);
    if (type === 'product-service') await saveProductService(form);
    if (type === 'message-template') await saveMessageTemplate(form);
    if (type === 'report-filters') handleReportFilters(form);
  } catch (error) {
    console.error(error);
    toast(error.message || 'No se pudo guardar.');
  }
});

app.addEventListener('input', (event) => {
  if (event.target.closest('[data-form="quote"]')) recalcQuoteForm();
});

window.addEventListener('hashchange', render);

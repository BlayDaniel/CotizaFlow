const STORAGE_KEY = 'cotizaflow_fase7_local_state_v1';
const config = window.COTIZAFLOW_CONFIG || {};
const app = document.getElementById('app');
const REFERRAL_STORAGE_KEY = 'cotizaflow_pending_referral_code_v1';
const QUOTE_DRAFT_STORAGE_KEY = 'cotizaflow_quote_form_draft_v1';
const PREFERENCES_STORAGE_KEY = 'cotizaflow_preferences_v1';
const MILK_RECORDS_STORAGE_KEY = 'cotizaflow_milk_records_v1';
const DAIRY_SETTINGS_STORAGE_KEY = 'cotizaflow_dairy_settings_v1';

const PLAN_CATALOG = {
  free: { name: 'Free', price: 0, quoteLimit: 5, users: 1, catalogLimit: 10, description: 'Prueba limitada para validar el producto.' },
  starter: { name: 'Starter', price: 9, quoteLimit: 50, users: 1, catalogLimit: 50, description: 'Para negocios pequeños que cotizan con frecuencia moderada.' },
  enterprise: { name: 'Enterprise', price: 39, quoteLimit: 500, users: 3, catalogLimit: 500, description: 'Mayor volumen, equipo pequeño, plantillas y reportes.' },
  custom: { name: 'A cotizar', price: null, quoteLimit: 500, users: 10, catalogLimit: 1000, description: 'Para empresas con alto volumen, múltiples usuarios o necesidades especiales.' }
};

const ACTIVE_BILLING_STATUSES = new Set(['active', 'trialing', 'on_trial', 'paid']);


const ROLE_DEFINITIONS = {
  superuser: {
    label: 'Superusuario',
    description: 'Acceso total: empresa, usuarios, ventas, catálogo, reportes, pagos, referidos e integraciones.',
    permissions: ['*']
  },
  admin: {
    label: 'Administrador',
    description: 'Administra operación diaria, configuración funcional, ventas, clientes, catálogo y reportes.',
    permissions: ['dashboard_read','reports_read','quotes_read','quotes_write','quotes_delete','clients_read','clients_write','clients_delete','catalog_read','catalog_write','catalog_delete','templates_read','templates_write','templates_delete','milk_read','milk_write','milk_delete','milk_export','settings_company','billing_manage','affiliates_manage','integrations_manage','users_manage']
  },
  ventas: {
    label: 'Ventas',
    description: 'Gestiona clientes, cotizaciones, seguimiento y catálogo en modo operativo.',
    permissions: ['dashboard_read','reports_read','quotes_read','quotes_write','clients_read','clients_write','catalog_read','templates_read']
  },
  operador_diario: {
    label: 'Operador diario',
    description: 'Registra llegadas diarias, productores y consulta el historial operativo.',
    permissions: ['dashboard_read','milk_read','milk_write','clients_read','clients_write']
  },
  contabilidad: {
    label: 'Contabilidad',
    description: 'Consulta reportes, pagos mensuales, control diario y datos necesarios para cierre.',
    permissions: ['dashboard_read','reports_read','milk_read','milk_export','clients_read','quotes_read','billing_manage']
  },
  lector: {
    label: 'Solo lectura',
    description: 'Consulta información sin crear, editar o eliminar registros.',
    permissions: ['dashboard_read','reports_read','quotes_read','clients_read','catalog_read','templates_read','milk_read']
  }
};

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
  teamMembers: [],
  currentMember: null,
  teamStorageMode: 'local',
  milkRecords: [],
  milkStorageMode: 'local',
  milkFilters: { month: currentMonthValue() },
  prefillMilkClientId: '',
  preferences: loadPreferences(),
  pendingReferralCode: captureReferralCode(),
  reportFilters: { period: 'all', status: 'all', attention: 'all' },
  clientFilters: { status: 'all', search: '' },
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
  default_whatsapp_template: '',
  logo_position: 'right',
  theme_preference: 'white',
  default_milk_price_per_liter: 0,
  default_milk_commission_rate: 0
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
  teamMembers: [],
  currentMember: null,
  teamStorageMode: 'local',
  milkRecords: [],
  milkStorageMode: 'local',
  milkFilters: { month: currentMonthValue() },
  prefillMilkClientId: '',
  preferences: loadPreferences(),
  reportFilters: { period: 'all', status: 'all', attention: 'all' },
  clientFilters: { status: 'all', search: '' }
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


const TRANSLATIONS = {
  es: {
    language: 'Idioma', spanish: 'Español', english: 'Inglés', dashboard: 'Dashboard', quotes: 'Cotizaciones',
    newQuote: 'Nueva cotización', followup: 'Seguimiento', clients: 'CRM clientes', catalog: 'Catálogo', templates: 'Plantillas',
    settings: 'Configuración', milkControl: 'Control Diario', company: 'Empresa', billing: 'Planes y pagos', affiliates: 'Referidos', integrations: 'Integraciones', users: 'Usuarios y roles',
    back: 'Regresar', theme: 'Temas', white: 'White', black: 'Black', saveSettings: 'Guardar configuración'
  },
  en: {
    language: 'Language', spanish: 'Spanish', english: 'English', dashboard: 'Dashboard', quotes: 'Quotes',
    newQuote: 'New quote', followup: 'Follow-up', clients: 'Client CRM', catalog: 'Catalog', templates: 'Templates',
    settings: 'Settings', milkControl: 'Daily control', company: 'Company', billing: 'Plans & payments', affiliates: 'Referrals', integrations: 'Integrations', users: 'Users & roles',
    back: 'Back', theme: 'Themes', white: 'White', black: 'Black', saveSettings: 'Save settings'
  }
};

function loadPreferences() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) || '{}');
    const language = ['es', 'en'].includes(parsed.language) ? parsed.language : 'es';
    const theme = ['white', 'black'].includes(parsed.theme) ? parsed.theme : 'white';
    return { language, theme };
  } catch (_error) {
    return { language: 'es', theme: 'white' };
  }
}

function savePreferences() {
  localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(state.preferences || { language: 'es', theme: 'white' }));
}

function setPreference(key, value, shouldRender = true) {
  if (!state.preferences) state.preferences = loadPreferences();
  if (key === 'language' && !['es', 'en'].includes(value)) return;
  if (key === 'theme' && !['white', 'black'].includes(value)) return;
  state.preferences[key] = value;
  savePreferences();
  applyPreferences();
  if (shouldRender) render();
}

function applyPreferences() {
  const prefs = state.preferences || loadPreferences();
  document.documentElement.lang = prefs.language || 'es';
  document.documentElement.dataset.theme = prefs.theme || 'white';
  document.body.dataset.theme = prefs.theme || 'white';
}

function t(key) {
  const lang = state.preferences?.language || 'es';
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.es[key] || key;
}

function renderLanguageSelector(extraClass = '') {
  const lang = state.preferences?.language || 'es';
  return `
    <label class="language-control ${extraClass}">
      <span>${escapeHtml(t('language'))}</span>
      <select data-language-select aria-label="${escapeHtml(t('language'))}">
        <option value="es" ${lang === 'es' ? 'selected' : ''}>${escapeHtml(t('spanish'))}</option>
        <option value="en" ${lang === 'en' ? 'selected' : ''}>${escapeHtml(t('english'))}</option>
      </select>
    </label>
  `;
}

function renderUtilityBar() {
  return `
    <div class="utility-bar">
      <div class="utility-title">${escapeHtml(state.company?.name || 'CotizaFlow')}</div>
      <div class="utility-actions">${currentRoleBadge()}${renderLanguageSelector()}</div>
    </div>
  `;
}


function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeRole(value) {
  const role = String(value || '').trim().toLowerCase();
  return ROLE_DEFINITIONS[role] ? role : 'lector';
}

function roleOptions(selected = 'lector') {
  return Object.entries(ROLE_DEFINITIONS).map(([key, role]) => `
    <option value="${key}" ${normalizeRole(selected) === key ? 'selected' : ''}>${escapeHtml(role.label)}</option>
  `).join('');
}

function roleLabel(roleKey = '') {
  const key = normalizeRole(roleKey);
  return ROLE_DEFINITIONS[key]?.label || ROLE_DEFINITIONS.lector.label;
}

function roleDescription(roleKey = '') {
  const key = normalizeRole(roleKey);
  return ROLE_DEFINITIONS[key]?.description || '';
}

function isCompanyOwner() {
  if (mode === 'local') return true;
  return Boolean(state.session?.id && state.company?.owner_user_id && String(state.company.owner_user_id) === String(state.session.id));
}

function getEffectiveRoleKey() {
  if (!state.session) return 'lector';
  if (isCompanyOwner()) return 'superuser';
  const email = normalizeEmail(state.session.email);
  const bySession = (state.teamMembers || []).find(member => {
    if (String(member.status || 'active') !== 'active') return false;
    if (member.user_id && state.session?.id && String(member.user_id) === String(state.session.id)) return true;
    return email && normalizeEmail(member.email) === email;
  });
  return normalizeRole(bySession?.role || state.currentMember?.role || 'lector');
}

function getEffectiveRole() {
  return ROLE_DEFINITIONS[getEffectiveRoleKey()] || ROLE_DEFINITIONS.lector;
}

function can(permission) {
  const role = getEffectiveRole();
  return role.permissions.includes('*') || role.permissions.includes(permission);
}

function firstSettingsRoute() {
  if (can('settings_company')) return 'settings';
  if (can('billing_manage')) return 'billing';
  if (can('users_manage')) return 'team';
  if (can('affiliates_manage')) return 'affiliates';
  if (can('integrations_manage')) return 'integrations';
  return 'dashboard';
}

function requirePermission(permission, message = 'Tu rol no tiene permiso para realizar esta acción.') {
  if (can(permission)) return true;
  toast(message);
  return false;
}

function renderAccessDenied() {
  return `
    <section class="card access-denied">
      <h1>Acceso restringido</h1>
      <p>Tu rol actual es <strong>${escapeHtml(roleLabel(getEffectiveRoleKey()))}</strong>. No tienes permiso para abrir este módulo.</p>
      <button class="btn secondary" data-route="dashboard">Volver al Dashboard</button>
    </section>
  `;
}

function currentRoleBadge() {
  const key = getEffectiveRoleKey();
  return `<span class="role-badge role-${escapeHtml(key)}">${escapeHtml(roleLabel(key))}</span>`;
}

function currentMonthValue(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function numberFmt(value, decimals = 2) {
  return new Intl.NumberFormat('es-DO', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Number(value || 0));
}

function milkFallbackKey() {
  const userId = state.session?.id || 'local-user';
  const companyId = state.company?.id || 'local-company';
  return `${MILK_RECORDS_STORAGE_KEY}:${userId}:${companyId}`;
}

function loadMilkRecordsLocalFallback() {
  try {
    const raw = localStorage.getItem(milkFallbackKey());
    return raw ? JSON.parse(raw).map(normalizeMilkRecord) : [];
  } catch (_error) {
    return [];
  }
}

function saveMilkRecordsLocalFallback() {
  try {
    localStorage.setItem(milkFallbackKey(), JSON.stringify(state.milkRecords || []));
  } catch (error) {
    console.warn('No se pudo guardar el control de leche local:', error);
  }
}

function dairySettingsFallbackKey() {
  const userId = state.session?.id || 'local-user';
  const companyId = state.company?.id || 'local-company';
  return `${DAIRY_SETTINGS_STORAGE_KEY}:${userId}:${companyId}`;
}

function loadDairySettingsFallback() {
  try {
    return JSON.parse(localStorage.getItem(dairySettingsFallbackKey()) || '{}');
  } catch (_error) {
    return {};
  }
}

function saveDairySettingsFallback(settings = {}) {
  try {
    localStorage.setItem(dairySettingsFallbackKey(), JSON.stringify(settings));
  } catch (error) {
    console.warn('No se pudo guardar la configuración ganadera local:', error);
  }
}

function getDairyDefaults() {
  const fallback = loadDairySettingsFallback();
  const company = state.company || {};
  return {
    price_per_liter: Number(company.default_milk_price_per_liter ?? fallback.default_milk_price_per_liter ?? 0),
    commission_rate: Number(company.default_milk_commission_rate ?? fallback.default_milk_commission_rate ?? 0)
  };
}

function normalizeTextKey(value) {
  return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
}

function milkClientRecords(client) {
  if (!client) return [];
  const clientId = String(client.id || '');
  const clientName = normalizeTextKey(client.name);
  return (state.milkRecords || []).filter(record => {
    if (record.client_id && clientId && String(record.client_id) === clientId) return true;
    return clientName && normalizeTextKey(record.producer_name) === clientName;
  });
}

function normalizeMilkRecord(record = {}) {
  const liters = Number(record.liters || 0);
  const price = Number(record.price_per_liter || record.price || 0);
  const commissionRate = Number(record.commission_rate || 0);
  const gross = liters * price;
  const commission = gross * (commissionRate / 100);
  return {
    id: record.id || uid('milk'),
    company_id: record.company_id || state.company?.id || 'local-company',
    client_id: record.client_id || record.producer_client_id || '',
    producer_name: String(record.producer_name || record.producer || '').trim(),
    delivery_date: String(record.delivery_date || record.date || todayISO()).slice(0, 10),
    liters,
    price_per_liter: price,
    commission_rate: commissionRate,
    notes: String(record.notes || '').trim(),
    created_at: record.created_at || new Date().toISOString(),
    updated_at: record.updated_at || record.created_at || new Date().toISOString(),
    gross_amount: gross,
    commission_amount: commission,
    net_amount: gross - commission
  };
}

async function loadMilkRecords() {
  state.milkStorageMode = 'local';
  state.milkRecords = mode === 'local' ? (state.milkRecords || []).map(normalizeMilkRecord) : loadMilkRecordsLocalFallback();
  if (mode !== 'supabase' || !supabaseClient || !state.company?.id) return;

  try {
    const { data, error } = await supabaseClient
      .from('milk_deliveries')
      .select('*')
      .eq('company_id', state.company.id)
      .order('delivery_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    state.milkRecords = (data || []).map(normalizeMilkRecord);
    state.milkStorageMode = 'supabase';
  } catch (error) {
    console.warn('Control de leche en modo local. Crea la tabla milk_deliveries para persistencia Supabase:', error.message || error);
  }
}

function getPendingReferralCode() {
  return sanitizeReferralCode(state.pendingReferralCode || localStorage.getItem(REFERRAL_STORAGE_KEY) || '');
}

applyPreferences();
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

    supabaseClient.auth.onAuthStateChange((event, session) => {
      // Evita recargar toda la aplicación cuando Supabase solo refresca el token.
      // Esa recarga era la causa de que una cotización sin guardar perdiera sus items
      // al cambiar de pestaña y volver al navegador.
      if (['TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
        if (session?.user) state.session = normalizeSession(session.user);
        return;
      }

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
      teamMembers: parsed.teamMembers || [],
      currentMember: parsed.currentMember || null,
      teamStorageMode: 'local',
      milkRecords: (parsed.milkRecords || []).map(normalizeMilkRecord),
      milkStorageMode: 'local',
      milkFilters: parsed.milkFilters || { month: currentMonthValue() },
      reportFilters: parsed.reportFilters || { period: 'all', status: 'all', attention: 'all' },
      clientFilters: parsed.clientFilters || { status: 'all', search: '' }
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
    teamMembers: state.teamMembers,
    currentMember: state.currentMember,
    teamStorageMode: state.teamStorageMode,
    milkRecords: state.milkRecords,
    milkFilters: state.milkFilters,
    reportFilters: state.reportFilters,
    clientFilters: state.clientFilters
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


function quoteDraftKey(id = '') {
  const userId = state.session?.id || 'local-user';
  const companyId = state.company?.id || 'local-company';
  return `${QUOTE_DRAFT_STORAGE_KEY}:${userId}:${companyId}:${id || 'new'}`;
}

function loadQuoteDraft(id = '') {
  try {
    const raw = sessionStorage.getItem(quoteDraftKey(id));
    if (!raw) return null;
    const draft = JSON.parse(raw);
    if (!draft || !Array.isArray(draft.items)) return null;
    return draft;
  } catch (error) {
    console.warn('No se pudo leer el borrador temporal de cotización:', error);
    return null;
  }
}

function clearQuoteDraft(id = '') {
  try {
    sessionStorage.removeItem(quoteDraftKey(id));
  } catch (error) {
    console.warn('No se pudo limpiar el borrador temporal de cotización:', error);
  }
}

function collectQuoteDraftFromForm(form) {
  const rows = [...form.querySelectorAll('[data-item-row]')];
  const items = rows.map((row, index) => {
    const description = row.querySelector('[name="item_description"]')?.value.trim() || '';
    const quantity = Number(row.querySelector('[name="item_quantity"]')?.value || 0);
    const unit_price = Number(row.querySelector('[name="item_unit_price"]')?.value || 0);
    return {
      id: uid('draft_item'),
      description,
      quantity,
      unit_price,
      total: quantity * unit_price,
      position: index
    };
  });

  return {
    id: form.dataset.id || '',
    quote_number: form.querySelector('[name="quote_number"]')?.value.trim() || '',
    client_id: form.querySelector('[name="client_id"]')?.value || '',
    status: form.querySelector('[name="status"]')?.value || 'draft',
    valid_until: form.querySelector('[name="valid_until"]')?.value || '',
    tax_rate: Number(form.querySelector('[name="tax_rate"]')?.value || 0),
    currency: form.querySelector('[name="currency"]')?.value.trim().toUpperCase() || state.company?.currency || 'USD',
    notes: form.querySelector('[name="notes"]')?.value || '',
    items: items.length ? items : [{ id: uid('draft_item'), description: '', quantity: 1, unit_price: 0, total: 0, position: 0 }],
    saved_at: new Date().toISOString()
  };
}

function saveQuoteDraftFromForm(form) {
  if (!form || form.dataset.form !== 'quote') return;
  try {
    const draft = collectQuoteDraftFromForm(form);
    sessionStorage.setItem(quoteDraftKey(draft.id), JSON.stringify(draft));
  } catch (error) {
    console.warn('No se pudo guardar el borrador temporal de cotización:', error);
  }
}

function getCurrentQuoteForm() {
  return document.querySelector('[data-form="quote"]');
}

async function loadRemoteData() {
  try {
    state.loading = true;
    render();

    const company = await getOrCreateRemoteCompany();
    state.company = normalizeCompany(company);
    await loadTeamMembers();
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

    await loadMilkRecords();
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
  if (existing) {
    await ensureOwnerMembership(existing);
    return existing;
  }

  const memberCompany = await getCompanyByMembership();
  if (memberCompany) return memberCompany;

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
  await ensureOwnerMembership(data);
  return data;
}

async function getCompanyByMembership() {
  if (!state.session?.email) return null;
  try {
    const email = normalizeEmail(state.session.email);
    const { data, error } = await supabaseClient
      .from('company_members')
      .select('*, companies(*)')
      .eq('email', email)
      .eq('status', 'active')
      .limit(1);
    if (error) throw error;
    const membership = data?.[0] || null;
    if (!membership?.companies) return null;
    state.currentMember = membership;
    if (!membership.user_id && state.session?.id) {
      try {
        await supabaseClient
          .from('company_members')
          .update({ user_id: state.session.id, updated_at: new Date().toISOString() })
          .eq('id', membership.id);
      } catch (linkError) {
        console.warn('No se pudo vincular user_id al miembro:', linkError.message || linkError);
      }
    }
    return membership.companies;
  } catch (error) {
    console.warn('Roles pendientes. Ejecuta schema_phase8d_roles_catalog.sql para activar usuarios por rol:', error.message || error);
    return null;
  }
}

async function ensureOwnerMembership(company) {
  if (!company?.id || !state.session?.email) return;
  try {
    const payload = {
      company_id: company.id,
      user_id: state.session.id,
      email: normalizeEmail(state.session.email),
      full_name: state.session.name || state.session.email,
      role: 'superuser',
      status: 'active',
      created_by_user_id: state.session.id,
      updated_at: new Date().toISOString()
    };
    await supabaseClient
      .from('company_members')
      .upsert(payload, { onConflict: 'company_id,email' });
  } catch (error) {
    console.warn('No se pudo asegurar el superusuario. Ejecuta schema_phase8d_roles_catalog.sql:', error.message || error);
  }
}

async function loadTeamMembers() {
  state.teamStorageMode = mode === 'local' ? 'local' : 'fallback';
  const ownerMember = {
    id: 'owner-member',
    company_id: state.company?.id || 'local-company',
    user_id: state.session?.id || 'local-user',
    email: normalizeEmail(state.session?.email || 'demo@cotizaflow.local'),
    full_name: state.session?.name || 'Superusuario',
    role: 'superuser',
    status: 'active',
    created_at: new Date().toISOString()
  };

  if (mode === 'local') {
    const existing = state.teamMembers?.length ? state.teamMembers : [ownerMember];
    state.teamMembers = existing;
    state.currentMember = existing.find(m => normalizeEmail(m.email) === normalizeEmail(state.session?.email)) || ownerMember;
    state.teamStorageMode = 'local';
    return;
  }

  if (!supabaseClient || !state.company?.id) {
    state.teamMembers = [ownerMember];
    state.currentMember = ownerMember;
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from('company_members')
      .select('*')
      .eq('company_id', state.company.id)
      .order('created_at', { ascending: true });
    if (error) throw error;
    state.teamMembers = data?.length ? data : [ownerMember];
    const sessionEmail = normalizeEmail(state.session?.email);
    state.currentMember = state.teamMembers.find(member => {
      if (String(member.status || 'active') !== 'active') return false;
      if (member.user_id && state.session?.id && String(member.user_id) === String(state.session.id)) return true;
      return sessionEmail && normalizeEmail(member.email) === sessionEmail;
    }) || ownerMember;
    state.teamStorageMode = 'supabase';
  } catch (error) {
    console.warn('Usuarios y roles en modo local/fallback:', error.message || error);
    state.teamMembers = isCompanyOwner() ? [ownerMember] : [];
    state.currentMember = isCompanyOwner() ? ownerMember : null;
  }
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
  applyPreferences();
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
  const showAuth = route === 'auth';
  app.innerHTML = `
    <main class="landing app-page marketing-page">
      <div class="landing-inner">
        <header class="topbar marketing-topbar">
          <div class="brand"><span class="brand-mark">C</span> CotizaFlow</div>
          <div class="nav-actions marketing-nav">
            <button class="link-button" data-scroll-target="features">Funciones</button>
            <button class="link-button" data-scroll-target="use-cases">Casos de uso</button>
            <button class="link-button" data-scroll-target="plans">Planes</button>
            <button class="link-button" data-scroll-target="contact">Contacto</button>
            ${renderLanguageSelector('marketing-language')}
            <button class="btn ghost" data-route="auth">Entrar</button>
            <button class="btn primary" data-route="auth">Crear cuenta</button>
          </div>
        </header>

        <section class="hero marketing-hero">
          <div>
            <span class="eyebrow">${usingSupabase ? 'Sistema conectado a Supabase' : 'Demo local disponible'}</span>
            <h1>Cotizaciones profesionales en minutos, con seguimiento hasta cerrar la venta.</h1>
            <p>CotizaFlow ayuda a talleres, técnicos, instaladores, imprentas y suplidores a crear cotizaciones claras, enviarlas por WhatsApp y dar seguimiento comercial sin depender de Excel.</p>
            <div class="hero-actions">
              <button class="btn primary" data-route="auth">Iniciar sesión / Crear cuenta</button>
              <button class="btn secondary" data-action="start-demo">Probar demo local</button>
            </div>
            <div class="trust-row">
              <span>PDF profesional</span>
              <span>Links públicos</span>
              <span>WhatsApp manual</span>
              <span>Dashboard comercial</span>
            </div>
          </div>

          <div class="marketing-preview-stack">
            <div class="preview-card quote-document-card">
              <div class="quote-preview">
                <div class="quote-preview-header">
                  <div>
                    <div class="quote-logo-sample">CF</div>
                    <h3>Talleres Almonte</h3>
                    <div class="num">RNC 000-000000-0</div>
                  </div>
                  <div style="text-align:right;">
                    <h3>Cotización</h3>
                    <div class="num">CF-2026-0001</div>
                    ${statusBadge('sent')}
                  </div>
                </div>
                <div class="quote-line"><span>Diagnóstico general</span><strong>US$35.00</strong></div>
                <div class="quote-line"><span>Cambio de aceite</span><strong>US$45.00</strong></div>
                <div class="quote-line"><span>Materiales</span><strong>US$28.00</strong></div>
                <div class="quote-total"><span>Total</span><span>US$108.00</span></div>
              </div>
            </div>
            <div class="mini-dashboard-card">
              <strong>Seguimiento comercial</strong>
              <div><span>Vistas sin respuesta</span><b>4</b></div>
              <div><span>Por vencer</span><b>2</b></div>
              <div><span>Tasa de cierre</span><b>38%</b></div>
            </div>
          </div>
        </section>

        <section id="features" class="marketing-section">
          <div class="section-heading">
            <span class="eyebrow">Funciones clave</span>
            <h2>Todo lo necesario para cotizar y dar seguimiento.</h2>
          </div>
          <div class="grid cols-3">
            <div class="feature-card"><h3>Cotizaciones con PDF</h3><p>Cliente, productos, impuestos, notas, logo y formato profesional listo para compartir.</p></div>
            <div class="feature-card"><h3>Seguimiento comercial</h3><p>Detecta cotizaciones vistas sin respuesta, vencidas, por vencer o enviadas sin abrir.</p></div>
            <div class="feature-card"><h3>Catálogo reutilizable</h3><p>Guarda servicios frecuentes y agrégalos a una cotización con un clic.</p></div>
            <div class="feature-card"><h3>WhatsApp manual</h3><p>Mensajes prellenados sin pagar API. Copia, abre WhatsApp y registra la actividad.</p></div>
            <div class="feature-card"><h3>CRM ligero</h3><p>Historial del cliente, montos cotizados, aceptados, último seguimiento y próximas acciones.</p></div>
            <div class="feature-card"><h3>Planes y referidos</h3><p>Pagos, límites por plan y programa de referidos preparado para monetización.</p></div>
          </div>
        </section>

        <section id="use-cases" class="marketing-section split-section">
          <div>
            <span class="eyebrow">Casos de uso</span>
            <h2>Diseñado para negocios que venden servicios y productos por conversación.</h2>
            <p class="section-copy">CotizaFlow funciona para talleres, instalaciones de cámaras, servicios eléctricos, aires acondicionados, imprentas, agencias de carga, suplidores y vendedores independientes.</p>
            <div class="use-case-list">
              <span>Taller automotriz: diagnóstico, piezas y mano de obra.</span>
              <span>CCTV: equipos, cableado, instalación y soporte.</span>
              <span>Imprenta: diseño, impresión, cantidades y entrega.</span>
              <span>Carga: flete, manejo, documentación y transporte.</span>
            </div>
          </div>
          <div class="quote-example-grid">
            <div class="sample-quote-small"><strong>CCTV</strong><span>Instalación cámara IP</span><b>US$250.00</b></div>
            <div class="sample-quote-small"><strong>Aires</strong><span>Mantenimiento split</span><b>US$45.00</b></div>
            <div class="sample-quote-small"><strong>Imprenta</strong><span>Flyers a color</span><b>US$60.00</b></div>
            <div class="sample-quote-small"><strong>Carga</strong><span>Gestión documental</span><b>US$45.00</b></div>
          </div>
        </section>

        <section id="plans" class="marketing-section">
          <div class="section-heading">
            <span class="eyebrow">Planes</span>
            <h2>Empieza simple y escala cuando tengas más volumen.</h2>
          </div>
          <div class="grid cols-3">
            <div class="plan-card card"><div class="plan-topline">Starter</div><div class="plan-price">US$9<span>/mes</span></div><p>Hasta 50 cotizaciones mensuales. Ideal para negocios pequeños.</p><button class="btn primary" data-route="auth">Comenzar</button></div>
            <div class="plan-card card"><div class="plan-topline">Enterprise</div><div class="plan-price">US$39<span>/mes</span></div><p>Hasta 500 cotizaciones mensuales, catálogo amplio y seguimiento comercial.</p><button class="btn primary" data-route="auth">Comenzar</button></div>
            <div class="plan-card card"><div class="plan-topline">A cotizar</div><div class="plan-price">Personalizado</div><p>Para empresas con alto volumen, múltiples usuarios o integraciones específicas.</p><a class="btn secondary" href="mailto:${escapeHtml(config.salesEmail || 'ventas@cotizaflow.app')}">Contactar</a></div>
          </div>
        </section>

        <section class="marketing-section testimonials">
          <div class="section-heading">
            <span class="eyebrow">Comentarios de usuarios</span>
            <h2>Opiniones de prueba para validar la propuesta.</h2>
          </div>
          <div class="grid cols-3">
            <div class="testimonial-card"><p>“Me permite mandar una cotización clara por WhatsApp sin volver a Excel.”</p><strong>Dueño de taller</strong></div>
            <div class="testimonial-card"><p>“El seguimiento me dice exactamente a quién escribirle primero.”</p><strong>Instalador CCTV</strong></div>
            <div class="testimonial-card"><p>“El catálogo acelera mucho los servicios que se repiten todas las semanas.”</p><strong>Suplidor local</strong></div>
          </div>
        </section>

        <section id="contact" class="marketing-section footer-section">
          <div>
            <h2>CotizaFlow</h2>
            <p>Sistema de cotizaciones, seguimiento comercial y CRM ligero para negocios de servicios.</p>
          </div>
          <div class="footer-links">
            <button class="link-button" data-scroll-target="plans">Planes</button>
            <a href="mailto:${escapeHtml(config.salesEmail || 'ventas@cotizaflow.app')}">Contacto</a>
            <button class="link-button" data-scroll-target="terms">Términos</button>
            <button class="link-button" data-scroll-target="privacy">Privacidad</button>
            <button class="link-button" data-scroll-target="support">Soporte</button>
          </div>
          <div id="terms" class="legal-copy"><span id="privacy"></span><span id="support"></span>
            <strong>Términos y condiciones.</strong> CotizaFlow es una herramienta de gestión de cotizaciones. El usuario es responsable de validar precios, impuestos, vigencias, términos comerciales y cumplimiento legal de sus propuestas.
            <br><br><strong>Privacidad.</strong> Los datos se usan para operar la cuenta, generar cotizaciones y registrar actividad comercial. No se debe almacenar información sensible innecesaria de clientes.
            <br><br><strong>Soporte.</strong> Para consultas comerciales o soporte, usa el correo configurado de ventas/contacto.
          </div>
        </section>
      </div>

      ${showAuth ? `
        <div class="auth-modal-backdrop" data-route="home">
          <section class="login-box auth-modal" onclick="event.stopPropagation()">
            <div class="modal-header">
              <div><h2>Acceso a CotizaFlow</h2><p>Inicia sesión o crea tu cuenta para continuar.</p></div>
              <button class="btn ghost small" data-route="home">Cerrar</button>
            </div>
            ${renderAuthBox()}
          </section>
        </div>
      ` : ''}
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
          ${navLink('dashboard', t('dashboard'))}
          ${can('reports_read') ? navLink('reports', t('followup')) : ''}
          ${state.company?.business_type === 'asociacion_ganaderos' && can('milk_read') ? navLink('milk', t('milkControl')) : ''}
          ${can('quotes_read') ? navLink('quotes', t('quotes')) : ''}
          ${can('clients_read') ? navLink('clients', t('clients')) : ''}
          ${can('catalog_read') ? navLink('catalog', t('catalog')) : ''}
          ${can('templates_read') ? navLink('templates', t('templates')) : ''}
          ${can('settings_company') || can('billing_manage') || can('affiliates_manage') || can('integrations_manage') || can('users_manage') ? navLink(firstSettingsRoute(), t('settings')) : ''}
        </nav>
        <div class="sidebar-footer">
          <strong>${escapeHtml(state.company?.name || 'Mi empresa')}</strong><br />
          ${mode === 'supabase' ? 'Modo Supabase' : 'Modo demo local'}<br />
          Plan: ${escapeHtml(planStatusText())}<br />
          <button class="btn secondary small" data-action="logout" style="margin-top:12px;">Salir</button>
        </div>
      </aside>
      <main class="main">${renderUtilityBar()}${renderRoute(route)}</main>
    </div>
  `;
}

function navLink(route, label) {
  return `<button class="nav-link ${getRoute() === route ? 'active' : ''}" data-route="${route}">${label}</button>`;
}

function renderRoute(route) {
  if (route.startsWith('quote-edit/')) return can('quotes_write') ? renderQuoteForm(route.split('/')[1]) : renderAccessDenied();
  if (route.startsWith('quote-view/')) return can('quotes_read') ? renderQuoteView(route.split('/')[1]) : renderAccessDenied();

  const routePermissions = {
    quotes: 'quotes_read',
    'quote-new': 'quotes_write',
    reports: 'reports_read',
    clients: 'clients_read',
    catalog: 'catalog_read',
    templates: 'templates_read',
    milk: 'milk_read',
    settings: 'settings_company',
    billing: 'billing_manage',
    affiliates: 'affiliates_manage',
    integrations: 'integrations_manage',
    team: 'users_manage'
  };
  const permission = routePermissions[route];
  if (permission && !can(permission)) return renderAccessDenied();

  switch (route) {
    case 'quotes': return renderQuotes();
    case 'quote-new': return renderQuoteForm();
    case 'reports': return renderReports();
    case 'clients': return renderClients();
    case 'catalog': return renderCatalog();
    case 'templates': return renderTemplates();
    case 'milk': return renderMilkControl();
    case 'settings': return renderSettings();
    case 'billing': return renderBilling();
    case 'affiliates': return renderAffiliates();
    case 'integrations': return renderIntegrations();
    case 'team': return renderTeamMembers();
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


function getDairyDashboardStats(month = currentMonthValue()) {
  const records = getMilkRecordsForMonth(month);
  const summary = summarizeMilkByProducer(records);
  const today = todayISO();
  const todayRecords = records.filter(record => record.delivery_date === today);
  const totals = records.reduce((acc, record) => {
    acc.liters += Number(record.liters || 0);
    acc.gross += Number(record.gross_amount || 0);
    acc.commission += Number(record.commission_amount || 0);
    acc.net += Number(record.net_amount || 0);
    return acc;
  }, { liters: 0, gross: 0, commission: 0, net: 0 });
  const todayTotals = todayRecords.reduce((acc, record) => {
    acc.liters += Number(record.liters || 0);
    acc.net += Number(record.net_amount || 0);
    return acc;
  }, { liters: 0, net: 0 });
  const uniqueDays = new Set(records.map(record => record.delivery_date).filter(Boolean));
  const dairyClients = (state.clients || []).filter(client => {
    const tags = normalizeTextKey([client.tags, client.notes].join(' '));
    return tags.includes('ganadero') || tags.includes('productor leche') || milkClientRecords(client).length > 0;
  });
  const dairyDefaults = getDairyDefaults();
  return {
    month,
    records,
    summary,
    totals,
    todayRecords,
    todayTotals,
    uniqueDays: uniqueDays.size,
    activeProducers: dairyClients.length || summary.length,
    averageLitersPerDay: uniqueDays.size ? totals.liters / uniqueDays.size : 0,
    dairyDefaults,
    latestRecords: records.slice(0, 8),
    pendingQuotes: getCommercialAnalytics().needsFollowup.length
  };
}

function renderDairyDashboardAlerts(stats) {
  const alerts = [];
  if (Number(stats.dairyDefaults.price_per_liter || 0) <= 0) alerts.push({ type: 'warning', title: 'Precio por litro pendiente', detail: 'Configúralo en Configuración > Empresa para registrar llegadas sin cálculo manual.' });
  if (!stats.todayRecords.length) alerts.push({ type: 'warning', title: 'Sin llegada registrada hoy', detail: 'Revisa si ya se recibió leche o si falta registrar la ruta del día.' });
  if (!stats.summary.length) alerts.push({ type: 'info', title: 'Mes sin cierre iniciado', detail: 'Cuando registres llegadas, el sistema generará el glosario mensual por productor.' });
  if (stats.pendingQuotes) alerts.push({ type: 'info', title: `${stats.pendingQuotes} cotización(es) requieren seguimiento`, detail: 'El módulo ganadero puede convivir con ventas y cotizaciones activas.' });
  if (!alerts.length) alerts.push({ type: 'ok', title: 'Operación al día', detail: 'Hay registros para hoy y el cierre mensual tiene datos para liquidación.' });

  return `
    <div class="card">
      <h2>Alertas operativas</h2>
      <div class="insight-list">
        ${alerts.slice(0, 4).map(alert => `
          <div class="card insight ${alert.type}">
            <strong>${escapeHtml(alert.title)}</strong>
            <span>${escapeHtml(alert.detail)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderDairyDashboard() {
  const stats = getDairyDashboardStats();
  const topProducers = stats.summary.slice(0, 6);
  return `
    <div class="page-header">
      <div>
        <h1>Dashboard ganadero</h1>
        <p>Control mensual de llegada de leche, comisiones y pagos netos por productor.</p>
      </div>
      <div class="header-actions">
        <button class="btn primary" data-route="milk">Registrar llegada</button>
        <button class="btn secondary" data-route="clients">Ver productores</button>
      </div>
    </div>

    <section class="grid cols-4 dairy-metrics">
      <div class="card metric"><span>Litros de hoy</span><strong>${numberFmt(stats.todayTotals.liters, 2)}</strong></div>
      <div class="card metric"><span>Litros del mes</span><strong>${numberFmt(stats.totals.liters, 2)}</strong></div>
      <div class="card metric"><span>Neto a pagar</span><strong>${money(stats.totals.net)}</strong></div>
      <div class="card metric"><span>Comisión asociación</span><strong>${money(stats.totals.commission)}</strong></div>
    </section>

    <section class="grid cols-4 dairy-metrics" style="margin-top:18px;">
      <div class="card metric"><span>Productores activos</span><strong>${stats.activeProducers}</strong></div>
      <div class="card metric"><span>Registros del mes</span><strong>${stats.records.length}</strong></div>
      <div class="card metric"><span>Promedio litros/día</span><strong>${numberFmt(stats.averageLitersPerDay, 2)}</strong></div>
      <div class="card metric"><span>Precio por litro</span><strong>${money(stats.dairyDefaults.price_per_liter)}</strong></div>
    </section>

    <section class="grid cols-2" style="margin-top:18px; align-items:start;">
      <div class="card">
        <div class="page-header" style="margin-bottom:12px;">
          <div>
            <h2>Top productores del mes</h2>
            <p>Ordenado por neto a pagar.</p>
          </div>
          <button class="btn secondary" data-route="milk">Cierre mensual</button>
        </div>
        ${topProducers.length ? renderMilkSummaryTable(topProducers) : `<div class="empty">Todavía no hay productores con registros este mes.</div>`}
      </div>
      ${renderDairyDashboardAlerts(stats)}
    </section>

    <section class="card" style="margin-top:18px;">
      <div class="page-header" style="margin-bottom:12px;">
        <div>
          <h2>Últimas llegadas registradas</h2>
          <p>Validación rápida antes del cierre mensual.</p>
        </div>
        <button class="btn secondary" data-route="milk">Abrir Control Diario</button>
      </div>
      ${stats.latestRecords.length ? renderMilkRecordsTable(stats.latestRecords) : `<div class="empty">No hay llegadas registradas en el mes actual.</div>`}
    </section>
  `;
}

function renderDashboard() {
  if (state.company?.business_type === 'asociacion_ganaderos') return renderDairyDashboard();
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
      ${can('quotes_write') ? '<button class="btn primary" data-route="quote-new">Nueva cotización</button>' : ''}
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
                    ${can('quotes_write') ? `<button class="btn secondary small" data-route="quote-edit/${quote.id}">Editar</button>` : ''}
                    <button class="btn secondary small" data-action="pdf" data-id="${quote.id}">PDF</button>
                    ${can('quotes_delete') ? `<button class="btn danger small" data-action="delete-quote" data-id="${quote.id}">Borrar</button>` : ''}
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


function clientStatusLabel(value) {
  return {
    lead: 'Prospecto',
    active: 'Activo',
    inactive: 'Inactivo',
    priority: 'Prioritario',
    lost: 'Perdido'
  }[String(value || 'lead')] || 'Prospecto';
}

function clientStatusOptions(selected = 'lead') {
  return [
    ['lead', 'Prospecto'],
    ['active', 'Activo'],
    ['priority', 'Prioritario'],
    ['inactive', 'Inactivo'],
    ['lost', 'Perdido']
  ].map(([value, label]) => `<option value="${value}" ${String(selected || 'lead') === value ? 'selected' : ''}>${label}</option>`).join('');
}

function quoteCreatedTime(quote) {
  const d = safeDate(quote.created_at);
  return d ? d.getTime() : 0;
}

function getClientQuotes(clientId) {
  return (state.quotes || []).filter(q => q.client_id === clientId);
}

function getClientLastFollowup(clientId) {
  const quoteIds = new Set(getClientQuotes(clientId).map(q => q.id));
  const events = (state.quoteEvents || []).filter(e => quoteIds.has(e.quote_id) && ['manual_followup','whatsapp_opened','whatsapp_copied','commented','accepted','rejected'].includes(e.event_type));
  return events.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))[0] || null;
}

function getClientStats(client) {
  const quotes = getClientQuotes(client.id);
  const totalQuoted = quotes.reduce((sum, q) => sum + quoteTotals(q).total, 0);
  const accepted = quotes.filter(q => q.status === 'accepted');
  const totalAccepted = accepted.reduce((sum, q) => sum + quoteTotals(q).total, 0);
  const pending = quotes.filter(q => ['draft','sent'].includes(q.status));
  const expired = quotes.filter(q => isQuoteExpired(q));
  const lastQuote = [...quotes].sort((a, b) => quoteCreatedTime(b) - quoteCreatedTime(a))[0] || null;
  const lastFollowup = getClientLastFollowup(client.id);
  const lastActivityAt = lastFollowup?.created_at || lastQuote?.updated_at || lastQuote?.created_at || client.updated_at || client.created_at;
  const milkRecords = milkClientRecords(client);
  const milkLiters = milkRecords.reduce((sum, record) => sum + Number(record.liters || 0), 0);
  const milkNet = milkRecords.reduce((sum, record) => sum + Number(record.net_amount || 0), 0);
  return { quotes, totalQuoted, accepted, totalAccepted, pending, expired, lastQuote, lastFollowup, lastActivityAt, milkRecords, milkLiters, milkNet };
}

function getFilteredClients() {
  const filters = state.clientFilters || { status: 'all', search: '' };
  const search = String(filters.search || '').trim().toLowerCase();
  return (state.clients || []).filter(client => {
    const status = String(client.commercial_status || (client.is_active === false ? 'inactive' : 'lead'));
    if (filters.status && filters.status !== 'all' && status !== filters.status) return false;
    if (!search) return true;
    const blob = [client.name, client.email, client.phone, client.address, client.tags, client.notes].join(' ').toLowerCase();
    return blob.includes(search);
  });
}

function renderClientFilters() {
  const filters = state.clientFilters || { status: 'all', search: '' };
  return `
    <form data-form="client-filters" class="form-grid three">
      <div class="field"><label>Buscar</label><input name="search" value="${escapeHtml(filters.search || '')}" placeholder="Nombre, teléfono, etiqueta..." /></div>
      <div class="field"><label>Estado comercial</label>
        <select name="status">
          <option value="all" ${filters.status === 'all' ? 'selected' : ''}>Todos</option>
          ${clientStatusOptions(filters.status).replace(/<option value="lead"/, '<option value="lead"')}
        </select>
      </div>
      <div class="field" style="align-self:end;"><button class="btn primary" type="submit">Filtrar clientes</button></div>
    </form>
  `;
}

function renderClients() {
  const clients = getFilteredClients();
  const all = state.clients || [];
  const totals = all.reduce((acc, client) => {
    const stats = getClientStats(client);
    acc.totalQuoted += stats.totalQuoted;
    acc.totalAccepted += stats.totalAccepted;
    if (stats.pending.length) acc.withPending += 1;
    if (stats.expired.length) acc.withExpired += 1;
    return acc;
  }, { totalQuoted: 0, totalAccepted: 0, withPending: 0, withExpired: 0 });

  return `
    <div class="page-header">
      <div>
        <h1>CRM de clientes</h1>
        <p>Ficha comercial, historial de cotizaciones, montos aceptados y próxima acción por cliente.</p>
      </div>

    </div>

    <section class="grid cols-4">
      <div class="card metric"><span>Clientes</span><strong>${all.length}</strong></div>
      <div class="card metric"><span>Total cotizado</span><strong>${money(totals.totalQuoted)}</strong></div>
      <div class="card metric"><span>Total aceptado</span><strong>${money(totals.totalAccepted)}</strong></div>
      <div class="card metric"><span>Con vencidas</span><strong>${totals.withExpired}</strong></div>
    </section>

    <section class="grid cols-2" style="margin-top:18px;">
      <div class="card">
        <h2>Nuevo cliente</h2>
        <form data-form="client" class="form-grid two">
          <div class="field"><label>Nombre</label><input name="name" required placeholder="Cliente o empresa" /></div>
          <div class="field"><label>Estado comercial</label><select name="commercial_status">${clientStatusOptions('lead')}</select></div>
          <div class="field"><label>Correo</label><input name="email" type="email" placeholder="cliente@email.com" /></div>
          <div class="field"><label>Teléfono</label><input name="phone" placeholder="809-000-0000" /></div>
          <div class="field" style="grid-column:1/-1;"><label>Etiquetas</label><input name="tags" placeholder="prioridad, taller, recurrente" /></div>
          <div class="field" style="grid-column:1/-1;"><label>Dirección</label><textarea name="address" placeholder="Dirección comercial"></textarea></div>
          <div class="field" style="grid-column:1/-1;"><label>Notas internas</label><textarea name="notes" placeholder="Preferencias, acuerdos, observaciones"></textarea></div>
          <button class="btn primary" type="submit">Guardar cliente</button>
        </form>
      </div>

      <div class="card">
        <h2>Filtros comerciales</h2>
        ${renderClientFilters()}
        <div class="notice" style="margin-top:14px;">Usa etiquetas y estado comercial para priorizar seguimiento. El historial se calcula automáticamente desde las cotizaciones y eventos registrados.</div>
      </div>
    </section>

    <section class="card" style="margin-top:18px;">
      <h2>Clientes</h2>
      ${clients.length ? renderClientCrmTable(clients) : `<div class="empty">No hay clientes para los filtros seleccionados.</div>`}
    </section>
  `;
}

function renderClientCrmTable(clients) {
  return `
    <div class="table-wrap crm-table">
      <table>
        <thead><tr><th>Cliente</th><th>Estado</th><th>Historial</th><th>Última actividad</th><th>Acciones</th></tr></thead>
        <tbody>
          ${clients.map(client => {
            const stats = getClientStats(client);
            const tags = String(client.tags || '').split(',').map(t => t.trim()).filter(Boolean);
            return `
              <tr>
                <td>
                  <strong>${escapeHtml(client.name)}</strong><br>
                  <span class="help">${escapeHtml(client.email || '')} ${client.phone ? '· ' + escapeHtml(client.phone) : ''}</span><br>
                  ${tags.length ? `<div class="tag-row">${tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
                  ${client.notes ? `<p class="help">${escapeHtml(client.notes)}</p>` : ''}
                </td>
                <td><span class="badge ${escapeHtml(client.commercial_status || 'draft')}">${escapeHtml(clientStatusLabel(client.commercial_status))}</span></td>
                <td>
                  <strong>${stats.quotes.length}</strong> cotizaciones<br>
                  <span class="help">Cotizado: ${money(stats.totalQuoted)} · Aceptado: ${money(stats.totalAccepted)}</span><br>
                  <span class="help">Pendientes: ${stats.pending.length} · Vencidas: ${stats.expired.length}</span>
                  ${stats.milkRecords?.length ? `<br><span class="help">Leche: ${numberFmt(stats.milkLiters, 2)} L · Neto acumulado: ${money(stats.milkNet)}</span>` : ''}
                </td>
                <td>
                  ${stats.lastQuote ? `<strong>${escapeHtml(stats.lastQuote.quote_number)}</strong><br><span class="help">Última cotización: ${escapeHtml(formatDateTime(stats.lastQuote.created_at))}</span>` : '<span class="help">Sin cotizaciones</span>'}
                  ${stats.lastFollowup ? `<br><span class="help">Seguimiento: ${escapeHtml(formatDateTime(stats.lastFollowup.created_at))}</span>` : ''}
                </td>
                <td>
                  <div class="actions">
                    ${can('quotes_write') ? `<button class="btn secondary small" data-route="quote-new" data-prefill-client="${client.id}">Cotizar</button>` : ''}
                    ${state.company?.business_type === 'asociacion_ganaderos' && can('milk_write') ? `<button class="btn secondary small" data-route="milk" data-prefill-milk-client="${client.id}">Control Diario</button>` : ''}
                    ${stats.lastQuote ? `<button class="btn secondary small" data-route="quote-view/${stats.lastQuote.id}">Ver última</button>` : ''}
                    ${can('clients_delete') ? `<button class="btn danger small" data-action="delete-client" data-id="${client.id}">Borrar</button>` : ''}
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
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
  ['suplidor', 'Suplidor'],
  ['asociacion_ganaderos', 'Asociación Ganaderos']
];

function businessTypeLabel(value) {
  return (BUSINESS_TYPES.find(([key]) => key === value)?.[1]) || 'General / servicios';
}

function businessTypeOptions(selected = 'general') {
  return BUSINESS_TYPES.map(([key, label]) => `<option value="${key}" ${String(selected || 'general') === key ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('');
}


const DAIRY_CATALOG_SEEDS = [
  { business_type: 'asociacion_ganaderos', name: 'Alimento concentrado para ganado', description: 'Saco de alimento concentrado para vacas lecheras.', category: 'Alimentos', unit: 'saco', default_quantity: 1, unit_price: 0, cost: 0 },
  { business_type: 'asociacion_ganaderos', name: 'Melaza para ganado', description: 'Melaza usada como suplemento energético.', category: 'Alimentos', unit: 'galón', default_quantity: 1, unit_price: 0, cost: 0 },
  { business_type: 'asociacion_ganaderos', name: 'Sal mineralizada', description: 'Suplemento mineral para ganado.', category: 'Suplementos', unit: 'saco', default_quantity: 1, unit_price: 0, cost: 0 },
  { business_type: 'asociacion_ganaderos', name: 'Vitaminas y reconstituyentes', description: 'Producto veterinario de apoyo nutricional.', category: 'Veterinaria', unit: 'unidad', default_quantity: 1, unit_price: 0, cost: 0 },
  { business_type: 'asociacion_ganaderos', name: 'Desparasitante bovino', description: 'Tratamiento desparasitante para ganado.', category: 'Veterinaria', unit: 'unidad', default_quantity: 1, unit_price: 0, cost: 0 },
  { business_type: 'asociacion_ganaderos', name: 'Vacuna bovina', description: 'Vacuna o biológico veterinario según disponibilidad.', category: 'Veterinaria', unit: 'dosis', default_quantity: 1, unit_price: 0, cost: 0 },
  { business_type: 'asociacion_ganaderos', name: 'Servicio veterinario', description: 'Consulta o asistencia veterinaria básica.', category: 'Servicios', unit: 'servicio', default_quantity: 1, unit_price: 0, cost: 0 },
  { business_type: 'asociacion_ganaderos', name: 'Inseminación artificial', description: 'Servicio de inseminación artificial bovina.', category: 'Servicios', unit: 'servicio', default_quantity: 1, unit_price: 0, cost: 0 },
  { business_type: 'asociacion_ganaderos', name: 'Transporte de leche', description: 'Servicio de ruta o acarreo de leche.', category: 'Logística', unit: 'servicio', default_quantity: 1, unit_price: 0, cost: 0 },
  { business_type: 'asociacion_ganaderos', name: 'Análisis de calidad de leche', description: 'Prueba básica de calidad, grasa, densidad o control sanitario.', category: 'Calidad', unit: 'servicio', default_quantity: 1, unit_price: 0, cost: 0 },
  { business_type: 'asociacion_ganaderos', name: 'Tanque o cubeta lechera', description: 'Recipiente para manejo o transporte de leche.', category: 'Equipos', unit: 'unidad', default_quantity: 1, unit_price: 0, cost: 0 },
  { business_type: 'asociacion_ganaderos', name: 'Manguera / accesorio de ordeño', description: 'Accesorio para equipo o sala de ordeño.', category: 'Equipos', unit: 'unidad', default_quantity: 1, unit_price: 0, cost: 0 },
  { business_type: 'asociacion_ganaderos', name: 'Detergente alcalino para ordeño', description: 'Producto de limpieza para equipos de ordeño.', category: 'Higiene', unit: 'galón', default_quantity: 1, unit_price: 0, cost: 0 },
  { business_type: 'asociacion_ganaderos', name: 'Sellador de pezones', description: 'Producto para higiene y prevención posterior al ordeño.', category: 'Higiene', unit: 'unidad', default_quantity: 1, unit_price: 0, cost: 0 },
  { business_type: 'asociacion_ganaderos', name: 'Gestión administrativa asociación', description: 'Cargo administrativo, certificación o servicio interno de la asociación.', category: 'Administración', unit: 'servicio', default_quantity: 1, unit_price: 0, cost: 0 }
];

function getDefaultCatalogSeeds(businessType = 'general') {
  const templates = (state.businessTemplates || []).filter(t => t.business_type === businessType || t.business_type === 'general');
  const dairy = businessType === 'asociacion_ganaderos' ? DAIRY_CATALOG_SEEDS : [];
  const merged = [...templates, ...dairy];
  const seen = new Set();
  return merged.filter(item => {
    const key = normalizeTextKey([item.category, item.name].filter(Boolean).join('|'));
    if (!item.name || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function catalogSeedToProduct(seed) {
  return {
    company_id: state.company?.id || 'local-company',
    name: String(seed.name || '').trim(),
    description: String(seed.description || '').trim(),
    category: String(seed.category || '').trim(),
    unit: String(seed.unit || 'unidad').trim(),
    default_quantity: Number(seed.default_quantity || 1),
    unit_price: Number(seed.unit_price || 0),
    cost: Number(seed.cost || 0),
    tax_rate: Number(seed.tax_rate ?? state.company?.tax_rate ?? 0),
    is_active: true,
    updated_at: new Date().toISOString()
  };
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
  const canWriteCatalog = can('catalog_write');
  const seedCount = getDefaultCatalogSeeds(state.company?.business_type || 'general').length;

  return `
    <div class="page-header">
      <div>
        <h1>Catálogo</h1>
        <p>Servicios y productos frecuentes para crear cotizaciones más rápido.</p>
      </div>
      <div class="header-actions">
        ${canWriteCatalog ? `<button class="btn secondary" data-action="seed-catalog">Cargar plantilla ${escapeHtml(businessTypeLabel(state.company?.business_type))}${seedCount ? ` (${seedCount})` : ''}</button>` : ''}
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
        <div class="field"><label>Nombre</label><input name="name" required placeholder="Instalación cámara IP" ${reached || !canWriteCatalog ? 'disabled' : ''} /></div>
        <div class="field"><label>Categoría</label><input name="category" placeholder="CCTV, Taller, Aire..." ${reached || !canWriteCatalog ? 'disabled' : ''} /></div>
        <div class="field"><label>Unidad</label>
          <select name="unit" ${reached || !canWriteCatalog ? 'disabled' : ''}>
            ${['servicio','unidad','hora','día','paquete','m2','m3','kg'].map(u => `<option value="${u}">${u}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Cantidad por defecto</label><input name="default_quantity" type="number" step="0.01" min="0" value="1" ${reached || !canWriteCatalog ? 'disabled' : ''} /></div>
        <div class="field"><label>Precio venta</label><input name="unit_price" type="number" step="0.01" min="0" value="0" ${reached || !canWriteCatalog ? 'disabled' : ''} /></div>
        <div class="field"><label>Costo interno opcional</label><input name="cost" type="number" step="0.01" min="0" value="0" ${reached || !canWriteCatalog ? 'disabled' : ''} /></div>
        <div class="field"><label>Impuesto % opcional</label><input name="tax_rate" type="number" step="0.01" min="0" value="${escapeHtml(state.company?.tax_rate || 0)}" ${reached || !canWriteCatalog ? 'disabled' : ''} /></div>
        <div class="field" style="grid-column:1/-1;"><label>Descripción para cotización</label><textarea name="description" placeholder="Descripción que se insertará en la cotización" ${reached || !canWriteCatalog ? 'disabled' : ''}></textarea></div>
        <button class="btn primary" type="submit" ${reached || !canWriteCatalog ? 'disabled' : ''}>Guardar en catálogo</button>
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
                <td>${can('catalog_delete') ? `<button class="btn danger small" data-action="delete-product-service" data-id="${item.id}">Desactivar</button>` : '<span class="help">Solo lectura</span>'}</td>
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

function renderLogoPreview(c) {
  if (!c.logo_data_url) return `<div class="logo-preview empty-logo">Sin logo</div>`;
  return `<div class="logo-preview"><img src="${escapeHtml(c.logo_data_url)}" alt="Logo empresa" /></div>`;
}


function renderConfigNav(active = 'settings') {
  const cards = [
    ['settings', t('company'), 'Datos fiscales, logo, temas y formato de cotización', 'settings_company'],
    ['billing', t('billing'), 'Suscripción, límites y checkout', 'billing_manage'],
    ['team', t('users'), 'Superusuario, roles y permisos por usuario', 'users_manage'],
    ['affiliates', t('affiliates'), 'Código, comisiones y enlace', 'affiliates_manage'],
    ['integrations', t('integrations'), 'Estado técnico y próximos conectores', 'integrations_manage']
  ].filter(([, , , permission]) => can(permission));
  return `
    <section class="grid cols-4 config-grid config-nav-grid">
      ${cards.map(([route, title, subtitle]) => `
        <button class="card config-card ${active === route ? 'active' : ''}" data-route="${route}">
          <strong>${escapeHtml(title)}</strong><span>${escapeHtml(subtitle)}</span>
        </button>
      `).join('')}
    </section>
  `;
}

function renderSettings() {
  const c = state.company || defaultCompany;
  const theme = state.preferences?.theme || c.theme_preference || 'white';
  const showDairySettings = String(c.business_type || 'general') === 'asociacion_ganaderos';
  return `
    <div class="page-header">
      <div>
        <h1>Configuración</h1>
        <p>Administra empresa, planes y pagos, referidos e integraciones desde un solo lugar.</p>
      </div>
      <div class="header-actions">
        <button class="btn secondary" data-route="dashboard">${escapeHtml(t('back'))}</button>
      </div>
    </div>

    ${renderConfigNav('settings')}

    <section class="card" style="margin-top:18px;">
      <h2>Empresa</h2>
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
        <div class="field"><label>${escapeHtml(t('theme'))}</label>
          <select name="theme_preference" data-theme-select>
            <option value="white" ${theme === 'white' ? 'selected' : ''}>White</option>
            <option value="black" ${theme === 'black' ? 'selected' : ''}>Black</option>
          </select>
          <p class="help">El tema Black cambia la paleta completa para trabajar con fondo oscuro.</p>
        </div>
        <div class="field dairy-setting-field ${showDairySettings ? '' : 'hidden'}" data-dairy-settings><label>Precio por litro de leche</label>
          <input name="default_milk_price_per_liter" type="number" step="0.01" min="0" value="${escapeHtml(c.default_milk_price_per_liter ?? loadDairySettingsFallback().default_milk_price_per_liter ?? 0)}" />
          <p class="help">Este precio se usa automáticamente en Control Diario.</p>
        </div>
        <div class="field dairy-setting-field ${showDairySettings ? '' : 'hidden'}" data-dairy-settings><label>% comisión asociación</label>
          <input name="default_milk_commission_rate" type="number" step="0.01" min="0" max="100" value="${escapeHtml(c.default_milk_commission_rate ?? loadDairySettingsFallback().default_milk_commission_rate ?? 0)}" />
          <p class="help">Este porcentaje se aplica automáticamente a cada llegada de leche.</p>
        </div>
        <div class="field"><label>Posición del logo en cotización</label>
          <select name="logo_position">
            ${[['left','Superior izquierda'], ['center','Superior centro'], ['right','Superior derecha']].map(([value, label]) => `<option value="${value}" ${String(c.logo_position || 'right') === value ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
        </div>
        <div class="field" style="grid-column:1/-1;"><label>Logo de empresa</label>
          <div class="logo-upload-row">
            ${renderLogoPreview(c)}
            <div>
              <input type="file" accept="image/*" data-logo-input />
              <input type="hidden" name="logo_data_url" value="${escapeHtml(c.logo_data_url || '')}" />
              <p class="help">Se guarda como imagen base64 para usarla en la vista de cotización y PDF. Recomendado: PNG/JPG horizontal, menos de 500 KB.</p>
              ${c.logo_data_url ? `<button class="btn secondary small" type="button" data-action="clear-logo">Quitar logo</button>` : ''}
            </div>
          </div>
        </div>
        <div class="field" style="grid-column:1/-1;"><label>Dirección</label><textarea name="address">${escapeHtml(c.address)}</textarea></div>
        <div class="field" style="grid-column:1/-1;"><label>Notas por defecto en cotizaciones</label><textarea name="default_quote_notes">${escapeHtml(c.default_quote_notes || defaultCompany.default_quote_notes)}</textarea></div>
        <div class="field" style="grid-column:1/-1;"><label>Términos y condiciones por defecto</label><textarea name="default_terms" placeholder="Opcional">${escapeHtml(c.default_terms || '')}</textarea></div>
        <div class="field" style="grid-column:1/-1;"><label>Mensaje WhatsApp por defecto</label><textarea name="default_whatsapp_template" placeholder="Usa variables: {{client_name}}, {{quote_number}}, {{quote_total}}, {{public_link}}, {{company_name}}">${escapeHtml(c.default_whatsapp_template || '')}</textarea></div>
        <button class="btn primary" type="submit">${escapeHtml(t('saveSettings'))}</button>
      </form>
    </section>

    ${c.business_type === 'asociacion_ganaderos' ? `
      <section class="card dairy-onboarding" style="margin-top:18px;">
        <h2>Control diario de leche activo</h2>
        <p>Al seleccionar Asociación Ganaderos se habilita el módulo para registrar litros recibidos, comisión y pagos mensuales por productor.</p>
        <button class="btn primary" data-route="milk">Abrir control de leche</button>
      </section>
    ` : ''}
  `;
}

function renderCompanyQuoteHeader(quote = null) {
  const c = state.company || defaultCompany;
  const position = String(c.logo_position || 'right');
  const logo = c.logo_data_url ? `<img class="quote-company-logo ${escapeHtml(position)}" src="${escapeHtml(c.logo_data_url)}" alt="Logo ${escapeHtml(c.name || '')}" />` : '';
  const companyBlock = `
    <div class="quote-company-info">
      <h2>${escapeHtml(c.name || '')}</h2>
      <p class="help">${escapeHtml(c.tax_id || '')} · ${escapeHtml(c.email || '')} · ${escapeHtml(c.phone || '')}</p>
      ${c.address ? `<p class="help">${escapeHtml(c.address)}</p>` : ''}
    </div>`;
  const quoteBlock = quote ? `
    <div class="quote-number-block">
      <h3>Cotización</h3>
      <strong>${escapeHtml(quote.quote_number || '')}</strong><br>
      <span class="help">Válida hasta ${escapeHtml(quote.valid_until || '')}</span>
    </div>` : '';

  if (position === 'center') {
    return `<div class="quote-brand-header center-logo">${logo}${companyBlock}${quoteBlock}</div>`;
  }
  if (position === 'left') {
    return `<div class="quote-brand-header left-logo"><div class="brand-side">${logo}${companyBlock}</div>${quoteBlock}</div>`;
  }
  return `<div class="quote-brand-header right-logo"><div>${companyBlock}</div><div class="brand-side right">${quoteBlock}${logo}</div></div>`;
}

function renderQuoteForm(id) {
  const quote = id ? state.quotes.find(q => q.id === id) : null;
  const editing = Boolean(quote);
  let current = quote ? clone(quote) : {
    id: '',
    quote_number: nextQuoteNumber(),
    client_id: state.prefillClientId || state.clients[0]?.id || '',
    status: 'draft',
    currency: state.company?.currency || 'USD',
    tax_rate: state.company?.tax_rate || 0,
    valid_until: addDaysISO(15),
    notes: state.company?.default_quote_notes || defaultCompany.default_quote_notes,
    items: [{ id: uid('item'), description: '', quantity: 1, unit_price: 0, total: 0 }]
  };

  const draft = loadQuoteDraft(id || '');
  if (draft) {
    current = {
      ...current,
      ...draft,
      id: quote?.id || '',
      items: draft.items?.length ? draft.items : current.items
    };
  }

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
    ${draft ? `<div class="notice">Se restauró un borrador temporal no guardado de esta cotización.</div>` : ''}

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
      ${renderCompanyQuoteHeader(quote)}

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


function getMilkRecordsForMonth(month) {
  const selected = month || state.milkFilters?.month || currentMonthValue();
  return (state.milkRecords || [])
    .map(normalizeMilkRecord)
    .filter(record => String(record.delivery_date || '').startsWith(selected))
    .sort((a, b) => String(b.delivery_date || '').localeCompare(String(a.delivery_date || '')) || String(b.created_at || '').localeCompare(String(a.created_at || '')));
}

function summarizeMilkByProducer(records) {
  const grouped = new Map();
  records.forEach(record => {
    const key = record.client_id || record.producer_name || 'Sin productor';
    const displayName = record.producer_name || (state.clients || []).find(c => String(c.id) === String(record.client_id))?.name || 'Sin productor';
    if (!grouped.has(key)) grouped.set(key, { producer_name: displayName, client_id: record.client_id || '', days: new Set(), records: 0, liters: 0, gross: 0, commission: 0, net: 0 });
    const row = grouped.get(key);
    row.records += 1;
    row.days.add(record.delivery_date);
    row.liters += Number(record.liters || 0);
    row.gross += Number(record.gross_amount || 0);
    row.commission += Number(record.commission_amount || 0);
    row.net += Number(record.net_amount || 0);
  });
  return [...grouped.values()]
    .map(row => ({ ...row, days: row.days.size }))
    .sort((a, b) => b.net - a.net);
}

function renderMilkControl() {
  const month = state.milkFilters?.month || currentMonthValue();
  const records = getMilkRecordsForMonth(month);
  const summary = summarizeMilkByProducer(records);
  const totals = summary.reduce((acc, row) => {
    acc.liters += row.liters;
    acc.gross += row.gross;
    acc.commission += row.commission;
    acc.net += row.net;
    return acc;
  }, { liters: 0, gross: 0, commission: 0, net: 0 });
  const dairyDefaults = getDairyDefaults();
  const selectedClientId = state.prefillMilkClientId || '';
  const clientOptions = (state.clients || [])
    .filter(client => client.is_active !== false)
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

  return `
    <div class="page-header">
      <div>
        <h1>Control Diario</h1>
        <p>Registra la llegada diaria por productor, calcula comisión y genera el cierre mensual imprimible.</p>
      </div>
      <div class="header-actions">
        <button class="btn secondary" data-action="milk-csv">Exportar CSV</button>
        <button class="btn primary" data-action="milk-pdf">PDF mensual</button>
      </div>
    </div>

    ${state.company?.business_type !== 'asociacion_ganaderos' ? `
      <div class="notice warning">
        Este módulo está pensado para <strong>Asociación Ganaderos</strong>. Puedes usarlo ahora, pero se recomienda seleccionar ese tipo de negocio en Configuración &gt; Empresa.
      </div>
    ` : ''}

    <section class="grid cols-4 dairy-metrics">
      <div class="card metric"><span>Litros del mes</span><strong>${numberFmt(totals.liters, 2)}</strong></div>
      <div class="card metric"><span>Monto bruto</span><strong>${money(totals.gross)}</strong></div>
      <div class="card metric"><span>Comisión</span><strong>${money(totals.commission)}</strong></div>
      <div class="card metric"><span>Neto a pagar</span><strong>${money(totals.net)}</strong></div>
    </section>

    <section class="grid cols-2" style="margin-top:18px; align-items:start;">
      <div class="card">
        <h2>Nuevo registro</h2>
        <form data-form="milk-delivery" class="form-grid two">
          <div class="field"><label>Fecha</label><input name="delivery_date" type="date" value="${todayISO()}" required /></div>
          <div class="field"><label>Productor desde CRM</label>
            <select name="producer_client_id">
              <option value="">Añadir nuevo productor</option>
              ${clientOptions.map(client => `<option value="${escapeHtml(client.id)}" ${String(client.id) === String(selectedClientId) ? 'selected' : ''}>${escapeHtml(client.name)}</option>`).join('')}
            </select>
            <p class="help">Selecciona un cliente existente para mantener su historial conectado.</p>
          </div>
          <div class="field"><label>Nuevo productor / ganadero</label>
            <input name="new_producer_name" placeholder="José Pérez" />
            <p class="help">Si no está en Clientes, se creará automáticamente en el CRM.</p>
          </div>
          <div class="field"><label>Litros recibidos</label><input name="liters" type="number" step="0.01" min="0" placeholder="20" required /></div>
          <div class="field"><label>Precio por litro</label><input name="price_per_liter" type="number" step="0.01" min="0" value="${escapeHtml(dairyDefaults.price_per_liter)}" readonly required /></div>
          <div class="field"><label>% comisión asociación</label><input name="commission_rate" type="number" step="0.01" min="0" max="100" value="${escapeHtml(dairyDefaults.commission_rate)}" readonly required /></div>
          <div class="field"><label>Nota</label><input name="notes" placeholder="Opcional: calidad, ruta, observación" /></div>
          <button class="btn primary" type="submit">Registrar llegada</button>
        </form>
        <p class="help" style="margin-top:12px;">Cálculo usado: litros × precio configurado = monto bruto. Comisión = monto bruto × % configurado. Neto a pagar = bruto - comisión.</p>
        <p class="help">Almacenamiento actual: ${state.milkStorageMode === 'supabase' ? 'Supabase' : 'local del navegador'}.</p>
      </div>

      <div class="card">
        <h2>Cierre mensual</h2>
        <form data-form="milk-filters" class="form-grid two">
          <div class="field"><label>Mes</label><input name="month" type="month" value="${escapeHtml(month)}" /></div>
          <button class="btn secondary" type="submit">Ver mes</button>
        </form>
        <div class="dairy-summary-list" style="margin-top:14px;">
          ${summary.length ? summary.slice(0, 5).map(row => `
            <div class="dairy-summary-row">
              <strong>${escapeHtml(row.producer_name)}</strong>
              <span>${numberFmt(row.liters, 2)} L · ${money(row.net)}</span>
            </div>
          `).join('') : `<div class="empty">No hay registros para este mes.</div>`}
        </div>
      </div>
    </section>

    <section class="card" style="margin-top:18px;">
      <h2>Glosario mensual de pago por productor</h2>
      ${summary.length ? renderMilkSummaryTable(summary) : `<div class="empty">Agrega registros diarios para generar el resumen mensual.</div>`}
    </section>

    <section class="card" style="margin-top:18px;">
      <h2>Registros diarios</h2>
      ${records.length ? renderMilkRecordsTable(records) : `<div class="empty">Todavía no hay llegadas registradas en este mes.</div>`}
    </section>
  `;
}

function renderMilkSummaryTable(summary) {
  return `
    <div class="table-wrap">
      <table class="compact-table">
        <thead><tr><th>Productor</th><th>Días</th><th>Registros</th><th>Litros</th><th>Bruto</th><th>Comisión</th><th>Neto a pagar</th></tr></thead>
        <tbody>
          ${summary.map(row => `
            <tr>
              <td><strong>${escapeHtml(row.producer_name)}</strong></td>
              <td>${row.days}</td>
              <td>${row.records}</td>
              <td>${numberFmt(row.liters, 2)} L</td>
              <td>${money(row.gross)}</td>
              <td>${money(row.commission)}</td>
              <td><strong>${money(row.net)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderMilkRecordsTable(records) {
  return `
    <div class="table-wrap">
      <table class="compact-table">
        <thead><tr><th>Fecha</th><th>Productor CRM</th><th>Litros</th><th>Precio/L</th><th>% Comisión</th><th>Neto</th><th>Nota</th><th></th></tr></thead>
        <tbody>
          ${records.map(record => `
            <tr>
              <td>${escapeHtml(record.delivery_date)}</td>
              <td><strong>${escapeHtml(record.producer_name)}</strong></td>
              <td>${numberFmt(record.liters, 2)} L</td>
              <td>${money(record.price_per_liter)}</td>
              <td>${numberFmt(record.commission_rate, 2)}%</td>
              <td><strong>${money(record.net_amount)}</strong></td>
              <td>${escapeHtml(record.notes || '')}</td>
              <td><button class="btn danger small" data-action="delete-milk-record" data-id="${escapeHtml(record.id)}">Borrar</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function handleMilkFilters(form) {
  const fd = new FormData(form);
  state.milkFilters = { month: String(fd.get('month') || currentMonthValue()) };
  saveLocalState();
  setRoute('milk');
  render();
}

async function resolveMilkProducerClient(clientId, newName) {
  const selectedId = String(clientId || '').trim();
  if (selectedId) {
    const selected = (state.clients || []).find(client => String(client.id) === selectedId);
    if (selected) return selected;
  }

  const cleanName = String(newName || '').trim();
  if (!cleanName) return null;

  const existing = (state.clients || []).find(client => normalizeTextKey(client.name) === normalizeTextKey(cleanName));
  if (existing) return existing;

  const payload = {
    company_id: state.company?.id || 'local-company',
    name: cleanName,
    email: '',
    phone: '',
    address: '',
    notes: 'Creado automáticamente desde Control Diario.',
    tags: 'ganadero, productor leche',
    commercial_status: 'active',
    is_active: true
  };

  if (mode === 'supabase') {
    const { data, error } = await supabaseClient.from('clients').insert(payload).select('*').single();
    if (error) throw error;
    state.clients.unshift(data);
    return data;
  }

  const client = { ...payload, id: uid('client'), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  state.clients.unshift(client);
  saveLocalState();
  return client;
}

async function insertMilkDeliverySupabase(payload, clientId) {
  const { data, error } = await supabaseClient.from('milk_deliveries').insert(payload).select('*').single();
  if (!error) return { ...data, client_id: data.client_id || clientId };

  const message = String(error.message || '').toLowerCase();
  if (message.includes('client_id') || message.includes('column')) {
    const fallbackPayload = { ...payload };
    delete fallbackPayload.client_id;
    const retry = await supabaseClient.from('milk_deliveries').insert(fallbackPayload).select('*').single();
    if (retry.error) throw retry.error;
    console.warn('La tabla milk_deliveries no tiene client_id. Ejecuta la migración Phase 8B para mantener el vínculo CRM en Supabase.');
    return { ...retry.data, client_id: clientId };
  }

  throw error;
}

async function saveMilkDelivery(form) {
  if (!requirePermission('milk_write')) return;
  const fd = new FormData(form);
  const dairyDefaults = getDairyDefaults();
  const producerClient = await resolveMilkProducerClient(fd.get('producer_client_id'), fd.get('new_producer_name'));

  if (!producerClient) {
    toast('Selecciona un productor del CRM o escribe uno nuevo.');
    return;
  }
  if (Number(dairyDefaults.price_per_liter || 0) <= 0) {
    toast('Configura el precio por litro en Configuración > Empresa.');
    setRoute('settings');
    render();
    return;
  }

  const record = normalizeMilkRecord({
    company_id: state.company?.id || 'local-company',
    client_id: producerClient.id,
    producer_name: producerClient.name,
    delivery_date: String(fd.get('delivery_date') || todayISO()),
    liters: Number(fd.get('liters') || 0),
    price_per_liter: Number(dairyDefaults.price_per_liter || 0),
    commission_rate: Number(dairyDefaults.commission_rate || 0),
    notes: String(fd.get('notes') || '').trim()
  });

  if (record.liters <= 0) {
    toast('Los litros deben ser mayores que cero.');
    return;
  }

  if (mode === 'supabase' && supabaseClient && state.milkStorageMode === 'supabase') {
    const payload = {
      company_id: state.company.id,
      client_id: record.client_id,
      producer_name: record.producer_name,
      delivery_date: record.delivery_date,
      liters: record.liters,
      price_per_liter: record.price_per_liter,
      commission_rate: record.commission_rate,
      notes: record.notes
    };
    const data = await insertMilkDeliverySupabase(payload, record.client_id);
    state.milkRecords.unshift(normalizeMilkRecord(data));
  } else {
    state.milkRecords.unshift(record);
    if (mode === 'local') saveLocalState();
    else saveMilkRecordsLocalFallback();
  }

  state.milkFilters = { month: record.delivery_date.slice(0, 7) };
  state.prefillMilkClientId = '';
  form.reset();
  toast('Llegada de leche registrada y conectada al CRM.');
  setRoute('milk');
  render();
}

async function deleteMilkRecord(id) {
  if (!requirePermission('milk_delete')) return;
  if (!confirm('¿Borrar este registro de leche?')) return;
  if (mode === 'supabase' && supabaseClient && state.milkStorageMode === 'supabase') {
    const { error } = await supabaseClient.from('milk_deliveries').delete().eq('id', id);
    if (error) throw error;
  }
  state.milkRecords = (state.milkRecords || []).filter(record => record.id !== id);
  if (mode === 'local') saveLocalState();
  else saveMilkRecordsLocalFallback();
  toast('Registro eliminado.');
  render();
}

function generateMilkPdf() {
  if (!requirePermission('milk_export')) return;
  if (!window.jspdf?.jsPDF) {
    toast('jsPDF no está disponible. Revisa tu conexión.');
    return;
  }
  const month = state.milkFilters?.month || currentMonthValue();
  const records = getMilkRecordsForMonth(month);
  const summary = summarizeMilkByProducer(records);
  const doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'letter' });
  const left = 44;
  let y = 48;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('Control Diario - resumen mensual de leche', left, y);
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${state.company?.name || 'Asociación'} · Mes: ${month}`, left, y);
  y += 28;

  doc.setFont('helvetica', 'bold');
  doc.text('Productor', left, y);
  doc.text('Litros', 230, y);
  doc.text('Bruto', 315, y);
  doc.text('Comisión', 405, y);
  doc.text('Neto a pagar', 500, y);
  y += 8;
  doc.line(left, y, 568, y);
  y += 18;
  doc.setFont('helvetica', 'normal');

  summary.forEach(row => {
    if (y > 720) { doc.addPage(); y = 48; }
    doc.text(String(row.producer_name).slice(0, 28), left, y);
    doc.text(numberFmt(row.liters, 2), 230, y);
    doc.text(money(row.gross), 315, y);
    doc.text(money(row.commission), 405, y);
    doc.text(money(row.net), 500, y);
    y += 18;
  });

  const totals = summary.reduce((acc, row) => {
    acc.liters += row.liters;
    acc.gross += row.gross;
    acc.commission += row.commission;
    acc.net += row.net;
    return acc;
  }, { liters: 0, gross: 0, commission: 0, net: 0 });

  y += 10;
  doc.line(left, y, 568, y);
  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.text('Totales', left, y);
  doc.text(numberFmt(totals.liters, 2), 230, y);
  doc.text(money(totals.gross), 315, y);
  doc.text(money(totals.commission), 405, y);
  doc.text(money(totals.net), 500, y);

  y += 32;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Detalle: el neto a pagar se calcula como monto bruto menos comisión de la asociación.', left, y);
  doc.save(`control-leche-${month}.pdf`);
}

function exportMilkCsv() {
  if (!requirePermission('milk_export')) return;
  const month = state.milkFilters?.month || currentMonthValue();
  const records = getMilkRecordsForMonth(month);
  if (!records.length) {
    toast('No hay registros para exportar.');
    return;
  }
  const headers = ['fecha', 'cliente_id', 'productor', 'litros', 'precio_por_litro', 'comision_pct', 'monto_bruto', 'comision', 'neto_a_pagar', 'nota'];
  const lines = [headers.join(',')].concat(records.map(record => [
    record.delivery_date,
    record.client_id || '',
    record.producer_name,
    record.liters,
    record.price_per_liter,
    record.commission_rate,
    record.gross_amount,
    record.commission_amount,
    record.net_amount,
    record.notes || ''
  ].map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')));
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `control-leche-${month}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast('CSV generado.');
}


function renderTeamMembers() {
  const members = state.teamMembers || [];
  const activeMembers = members.filter(member => String(member.status || 'active') === 'active');
  const ownerEmail = normalizeEmail(state.session?.email || '');
  return `
    <div class="page-header">
      <div>
        <h1>Usuarios y roles</h1>
        <p>Define quién puede cotizar, registrar Control Diario, ver reportes, administrar pagos o configurar la empresa.</p>
      </div>
      <div class="header-actions"><button class="btn secondary" data-route="settings">${escapeHtml(t('back'))}</button></div>
    </div>

    ${renderConfigNav('team')}

    <section class="grid cols-3" style="margin-top:18px;">
      <div class="card metric"><span>Tu rol</span><strong>${escapeHtml(roleLabel(getEffectiveRoleKey()))}</strong></div>
      <div class="card metric"><span>Usuarios activos</span><strong>${activeMembers.length}</strong></div>
      <div class="card metric"><span>Modo roles</span><strong>${state.teamStorageMode === 'supabase' ? 'Supabase' : 'Local'}</strong></div>
    </section>

    ${state.teamStorageMode !== 'supabase' && mode === 'supabase' ? `
      <div class="notice warning" style="margin-top:18px;">
        Ejecuta <code>supabase/schema_phase8d_roles_catalog.sql</code> para activar usuarios y roles con persistencia real en Supabase.
      </div>
    ` : ''}

    <section class="card" style="margin-top:18px;">
      <h2>Agregar o actualizar usuario</h2>
      <form data-form="team-member" class="form-grid three">
        <div class="field"><label>Nombre</label><input name="full_name" placeholder="José Pérez" /></div>
        <div class="field"><label>Correo</label><input name="email" type="email" required placeholder="usuario@empresa.com" /></div>
        <div class="field"><label>Rol</label><select name="role">${roleOptions('ventas')}</select></div>
        <div class="field"><label>Estado</label>
          <select name="status">
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </div>
        <div class="field" style="grid-column:1/-1;">
          <p class="help">El usuario debe crear cuenta con ese mismo correo. Al entrar, la app lo vinculará a esta empresa y aplicará su rol.</p>
        </div>
        <button class="btn primary" type="submit">Guardar usuario</button>
      </form>
    </section>

    <section class="card" style="margin-top:18px;">
      <h2>Roles actuales</h2>
      ${members.length ? `
        <div class="table-wrap">
          <table>
            <thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Permisos</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              ${members.map(member => {
                const roleKey = normalizeRole(member.role);
                const isSelf = normalizeEmail(member.email) === ownerEmail || (member.user_id && state.session?.id && String(member.user_id) === String(state.session.id));
                const isOwnerSuper = isSelf && isCompanyOwner();
                return `
                  <tr>
                    <td><strong>${escapeHtml(member.full_name || 'Sin nombre')}</strong>${isSelf ? '<br><span class="help">Tu usuario</span>' : ''}</td>
                    <td>${escapeHtml(member.email || '')}</td>
                    <td>${escapeHtml(roleLabel(roleKey))}</td>
                    <td><span class="help">${escapeHtml(roleDescription(roleKey))}</span></td>
                    <td>${String(member.status || 'active') === 'active' ? '<span class="status accepted">Activo</span>' : '<span class="status rejected">Inactivo</span>'}</td>
                    <td>
                      ${isOwnerSuper ? '<span class="help">Protegido</span>' : `<button class="btn danger small" data-action="deactivate-team-member" data-id="${escapeHtml(member.id)}">Desactivar</button>`}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      ` : `<div class="empty">Todavía no hay usuarios definidos.</div>`}
    </section>

    <section class="card" style="margin-top:18px;">
      <h2>Mapa de roles</h2>
      <div class="role-grid">
        ${Object.entries(ROLE_DEFINITIONS).map(([key, role]) => `
          <div class="role-card">
            <strong>${escapeHtml(role.label)}</strong>
            <p>${escapeHtml(role.description)}</p>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

async function saveTeamMember(form) {
  if (!requirePermission('users_manage')) return;
  const fd = new FormData(form);
  const email = normalizeEmail(fd.get('email'));
  const payload = {
    company_id: state.company?.id || 'local-company',
    email,
    full_name: String(fd.get('full_name') || '').trim() || email,
    role: normalizeRole(fd.get('role')),
    status: ['active','inactive'].includes(String(fd.get('status') || 'active')) ? String(fd.get('status') || 'active') : 'active',
    updated_at: new Date().toISOString()
  };
  if (!payload.email) {
    toast('El correo es obligatorio.');
    return;
  }
  if (payload.email === normalizeEmail(state.session?.email) && isCompanyOwner()) {
    payload.role = 'superuser';
    payload.status = 'active';
    payload.user_id = state.session.id;
  }

  if (mode === 'supabase') {
    const remotePayload = { ...payload, created_by_user_id: state.session?.id || null };
    if (payload.email === normalizeEmail(state.session?.email)) remotePayload.user_id = state.session.id;
    const { error } = await supabaseClient
      .from('company_members')
      .upsert(remotePayload, { onConflict: 'company_id,email' });
    if (error) throw error;
    await loadTeamMembers();
  } else {
    const existing = (state.teamMembers || []).find(member => normalizeEmail(member.email) === payload.email);
    if (existing) Object.assign(existing, payload);
    else state.teamMembers.push({ ...payload, id: uid('member'), created_at: new Date().toISOString() });
    state.currentMember = state.teamMembers.find(member => normalizeEmail(member.email) === normalizeEmail(state.session?.email)) || state.currentMember;
    saveLocalState();
  }
  form.reset();
  toast('Usuario y rol guardados.');
  setRoute('team');
  render();
}

async function deactivateTeamMember(id) {
  if (!requirePermission('users_manage')) return;
  const member = (state.teamMembers || []).find(item => String(item.id) === String(id));
  if (!member) return;
  if (normalizeEmail(member.email) === normalizeEmail(state.session?.email) && isCompanyOwner()) {
    toast('No puedes desactivar el superusuario propietario.');
    return;
  }
  if (!confirm('¿Desactivar este usuario?')) return;
  if (mode === 'supabase') {
    const { error } = await supabaseClient
      .from('company_members')
      .update({ status: 'inactive', updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    await loadTeamMembers();
  } else {
    state.teamMembers = state.teamMembers.map(item => String(item.id) === String(id) ? { ...item, status: 'inactive', updated_at: new Date().toISOString() } : item);
    saveLocalState();
  }
  toast('Usuario desactivado.');
  setRoute('team');
  render();
}

function renderIntegrations() {
  return `
    <div class="page-header">
      <div>
        <h1>Integraciones</h1>
        <p>Estado técnico de pagos, referidos, links públicos, catálogo, plantillas y control ganadero.</p>
      </div>
      <div class="header-actions"><button class="btn secondary" data-route="settings">${escapeHtml(t('back'))}</button></div>
    </div>

    ${renderConfigNav('integrations')}

    <section class="grid cols-2" style="margin-top:18px;">
      <div class="card">
        <h2>Base de datos</h2>
        <p><strong>Estado:</strong> ${mode === 'supabase' ? 'Supabase conectado' : 'modo local'}</p>
        <p class="help">Ejecuta los SQL de Supabase cuando quieras persistencia real para módulos nuevos. Para control ganadero y roles usa <code>supabase/schema_phase8b_dairy_crm_settings.sql</code> y luego <code>supabase/schema_phase8d_roles_catalog.sql</code>.</p>
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
      <div class="header-actions"><button class="btn secondary" data-route="settings">${escapeHtml(t('back'))}</button></div>
    </div>

    ${renderConfigNav('billing')}

    <div style="margin-top:18px;">${renderUsageCard()}</div>

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
      <div class="header-actions"><button class="btn secondary" data-route="settings">${escapeHtml(t('back'))}</button></div>
    </div>

    ${renderConfigNav('affiliates')}

    <div style="margin-top:18px;"></div>

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
  if (!requirePermission('settings_company')) return;
  const fd = new FormData(form);
  const themePreference = ['white','black'].includes(String(fd.get('theme_preference') || 'white')) ? String(fd.get('theme_preference') || 'white') : 'white';
  setPreference('theme', themePreference, false);

  const nextBusinessType = String(fd.get('business_type') || 'general').trim();
  const currentDairyFallback = loadDairySettingsFallback();
  const dairyFields = nextBusinessType === 'asociacion_ganaderos' ? {
    default_milk_price_per_liter: Number(fd.get('default_milk_price_per_liter') || 0),
    default_milk_commission_rate: Number(fd.get('default_milk_commission_rate') || 0)
  } : {
    default_milk_price_per_liter: Number(state.company?.default_milk_price_per_liter ?? currentDairyFallback.default_milk_price_per_liter ?? 0),
    default_milk_commission_rate: Number(state.company?.default_milk_commission_rate ?? currentDairyFallback.default_milk_commission_rate ?? 0)
  };

  const payload = {
    name: String(fd.get('name') || '').trim(),
    tax_id: String(fd.get('tax_id') || '').trim(),
    email: String(fd.get('email') || '').trim(),
    phone: String(fd.get('phone') || '').trim(),
    address: String(fd.get('address') || '').trim(),
    currency: String(fd.get('currency') || 'USD').trim().toUpperCase(),
    tax_rate: Number(fd.get('tax_rate') || 0),
    business_type: nextBusinessType,
    default_quote_notes: String(fd.get('default_quote_notes') || '').trim(),
    default_terms: String(fd.get('default_terms') || '').trim(),
    default_whatsapp_template: String(fd.get('default_whatsapp_template') || '').trim(),
    logo_data_url: String(fd.get('logo_data_url') || '').trim(),
    logo_position: ['left','center','right'].includes(String(fd.get('logo_position') || 'right')) ? String(fd.get('logo_position') || 'right') : 'right'
  };

  saveDairySettingsFallback(dairyFields);

  if (mode === 'supabase') {
    const fullPayload = { ...payload, ...dairyFields };
    let result = await supabaseClient
      .from('companies')
      .update(fullPayload)
      .eq('id', state.company.id)
      .select('*')
      .single();

    if (result.error) {
      const message = String(result.error.message || '').toLowerCase();
      if (message.includes('default_milk') || message.includes('column')) {
        console.warn('Las columnas ganaderas no existen en companies. Ejecuta schema_phase8b_dairy_crm_settings.sql para guardarlas en Supabase.');
        result = await supabaseClient
          .from('companies')
          .update(payload)
          .eq('id', state.company.id)
          .select('*')
          .single();
      }
    }

    if (result.error) throw result.error;
    state.company = { ...normalizeCompany(result.data), ...dairyFields, theme_preference: themePreference };
  } else {
    state.company = { ...state.company, ...payload, ...dairyFields, theme_preference: themePreference };
    saveLocalState();
  }
  toast('Empresa guardada.');
  render();
}

async function saveClient(form) {
  if (!requirePermission('clients_write')) return;
  const fd = new FormData(form);
  const payload = {
    company_id: state.company.id,
    name: String(fd.get('name') || '').trim(),
    email: String(fd.get('email') || '').trim(),
    phone: String(fd.get('phone') || '').trim(),
    address: String(fd.get('address') || '').trim(),
    notes: String(fd.get('notes') || '').trim(),
    tags: String(fd.get('tags') || '').trim(),
    commercial_status: String(fd.get('commercial_status') || 'lead').trim(),
    is_active: true
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
  if (!requirePermission('clients_delete')) return;
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
  if (!requirePermission('quotes_write')) return;
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
    clearQuoteDraft(quote.id || '');
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
  clearQuoteDraft(quote.id || '');
  saveLocalState();
  toast('Cotización guardada.');
  const savedId = quote.id || state.quotes[0].id;
  setRoute(`quote-view/${savedId}`);
  render();
}

async function deleteQuote(id) {
  if (!requirePermission('quotes_delete')) return;
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
  saveQuoteDraftFromForm(getCurrentQuoteForm());
}

function removeItemRow(button) {
  const rows = document.querySelectorAll('[data-item-row]');
  if (rows.length <= 1) {
    toast('Debe quedar al menos un item.');
    return;
  }
  button.closest('[data-item-row]').remove();
  recalcQuoteForm();
  saveQuoteDraftFromForm(getCurrentQuoteForm());
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

  const emptyRow = [...container.querySelectorAll('[data-item-row]')].find(row => {
    const desc = row.querySelector('[name="item_description"]')?.value.trim();
    const qty = Number(row.querySelector('[name="item_quantity"]')?.value || 0);
    const price = Number(row.querySelector('[name="item_unit_price"]')?.value || 0);
    return !desc && (qty === 0 || qty === 1) && price === 0;
  });

  if (emptyRow) {
    emptyRow.querySelector('[name="item_description"]').value = description;
    emptyRow.querySelector('[name="item_quantity"]').value = quantity;
    emptyRow.querySelector('[name="item_unit_price"]').value = unit_price;
    emptyRow.querySelector('[name="item_total"]').value = total.toFixed(2);
  } else {
    container.insertAdjacentHTML('beforeend', renderItemRow({ description, quantity, unit_price, total }));
  }

  recalcQuoteForm();
  saveQuoteDraftFromForm(getCurrentQuoteForm());
  select.value = '';
  toast('Item agregado desde catálogo.');
}

async function saveProductService(form) {
  if (!requirePermission('catalog_write')) return;
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
  if (!requirePermission('catalog_delete')) return;
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
  if (!requirePermission('catalog_write')) return;
  const businessType = state.company?.business_type || 'general';
  const seeds = getDefaultCatalogSeeds(businessType);
  if (!seeds.length) {
    toast('No hay plantilla de catálogo para este tipo de negocio todavía.');
    return;
  }

  const existingNames = new Set(activeProductsServices().map(p => normalizeTextKey([p.category, p.name].filter(Boolean).join('|'))));
  const missing = seeds
    .map(catalogSeedToProduct)
    .filter(item => item.name && !existingNames.has(normalizeTextKey([item.category, item.name].filter(Boolean).join('|'))));

  if (!missing.length) {
    toast('La plantilla ya estaba cargada.');
    setRoute('catalog');
    render();
    return;
  }

  if (mode === 'supabase') {
    const { error } = await supabaseClient.from('products_services').insert(missing);
    if (error) throw error;
    await loadRemoteData();
  } else {
    missing.forEach(item => {
      state.productsServices.unshift({ ...item, id: uid('prod'), created_at: new Date().toISOString() });
    });
    saveLocalState();
    render();
  }
  setRoute('catalog');
  toast(`Catálogo base cargado: ${missing.length} item${missing.length === 1 ? '' : 's'}.`);
}

async function saveMessageTemplate(form) {
  if (!requirePermission('templates_write')) return;
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
  if (!requirePermission('templates_delete')) return;
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
  const right = 568;
  const company = state.company || defaultCompany;
  const logoPosition = String(company.logo_position || 'right');
  let y = 48;

  if (company.logo_data_url) {
    try {
      const logoW = 82;
      const logoH = 48;
      const logoX = logoPosition === 'left' ? left : logoPosition === 'center' ? 265 : right - logoW;
      doc.addImage(company.logo_data_url, undefined, logoX, 36, logoW, logoH);
      if (logoPosition === 'center') y = 104;
    } catch (error) {
      console.warn('No se pudo colocar el logo en el PDF:', error);
    }
  }

  const companyX = logoPosition === 'left' && company.logo_data_url ? 140 : left;
  const quoteX = 420;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(company.name || 'CotizaFlow', companyX, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  y += 16;
  doc.text(`${company.tax_id || ''}  ${company.email || ''}  ${company.phone || ''}`, companyX, y);
  if (company.address) {
    y += 13;
    doc.text(doc.splitTextToSize(company.address, 300), companyX, y);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('COTIZACIÓN', quoteX, 48);
  doc.setFontSize(10);
  doc.text(quote.quote_number || '', quoteX, 65);
  doc.setFont('helvetica', 'normal');
  doc.text(`Estado: ${statusLabel(quote.status)}`, quoteX, 82);
  doc.text(`Válida hasta: ${quote.valid_until || ''}`, quoteX, 99);

  y = 124;
  doc.setDrawColor(220);
  doc.line(left, y, right, y);
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
  doc.line(left, y, right, y);
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
  doc.line(360, y, right, y);
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

  const footerText = [quote.notes || '', company.default_terms ? `Términos: ${company.default_terms}` : ''].filter(Boolean).join('\n\n');
  if (footerText) {
    y += 34;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const notes = doc.splitTextToSize(footerText, 500);
    doc.text(notes, left, y);
  }

  doc.save(`${quote.quote_number || 'cotizacion'}.pdf`);
}

async function startCheckout(planKey) {
  if (!requirePermission('billing_manage')) return;
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
  if (!requirePermission('affiliates_manage')) return;
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



function handleClientFilters(form) {
  const fd = new FormData(form);
  state.clientFilters = {
    search: String(fd.get('search') || '').trim(),
    status: String(fd.get('status') || 'all')
  };
  saveLocalState();
  setRoute('clients');
  render();
}

function clearCompanyLogo() {
  const form = document.querySelector('[data-form="company"]');
  const hidden = form?.querySelector('[name="logo_data_url"]');
  if (hidden) hidden.value = '';
  state.company = { ...state.company, logo_data_url: '' };
  if (mode === 'local') saveLocalState();
  render();
}

function handleLogoFileInput(input) {
  const file = input.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    toast('Selecciona una imagen válida.');
    return;
  }
  if (file.size > 900 * 1024) {
    toast('El logo está muy pesado. Usa una imagen menor a 900 KB.');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = String(reader.result || '');
    const form = input.closest('[data-form="company"]');
    const hidden = form?.querySelector('[name="logo_data_url"]');
    if (hidden) hidden.value = dataUrl;
    const preview = form?.querySelector('.logo-preview');
    if (preview) preview.innerHTML = `<img src="${dataUrl}" alt="Logo empresa" />`;
    toast('Logo cargado. Presiona Guardar configuración.');
  };
  reader.readAsDataURL(file);
}

function restoreVisibleApp() {
  if (state.loading) return;
  if (!app.innerHTML.trim()) render();
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
  const scrollTarget = event.target.closest('[data-scroll-target]')?.dataset.scrollTarget;
  if (scrollTarget) {
    document.getElementById(scrollTarget)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  const route = event.target.closest('[data-route]')?.dataset.route;
  const actionEl = event.target.closest('[data-action]');
  const authTab = event.target.closest('[data-auth-tab]')?.dataset.authTab;

  if (route) {
    const prefillClient = event.target.closest('[data-prefill-client]')?.dataset.prefillClient || '';
    const prefillMilkClient = event.target.closest('[data-prefill-milk-client]')?.dataset.prefillMilkClient || prefillClient;
    state.prefillClientId = route === 'quote-new' ? prefillClient : '';
    state.prefillMilkClientId = route === 'milk' ? prefillMilkClient : '';
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
    if (action === 'deactivate-team-member') await deactivateTeamMember(id);
    if (action === 'clear-logo') clearCompanyLogo();
    if (action === 'delete-milk-record') await deleteMilkRecord(id);
    if (action === 'milk-pdf') generateMilkPdf();
    if (action === 'milk-csv') exportMilkCsv();
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
    if (type === 'team-member') await saveTeamMember(form);
    if (type === 'milk-delivery') await saveMilkDelivery(form);
    if (type === 'milk-filters') handleMilkFilters(form);
    if (type === 'report-filters') handleReportFilters(form);
    if (type === 'client-filters') handleClientFilters(form);
  } catch (error) {
    console.error(error);
    toast(error.message || 'No se pudo guardar.');
  }
});

app.addEventListener('input', (event) => {
  const quoteForm = event.target.closest('[data-form="quote"]');
  if (quoteForm) {
    recalcQuoteForm();
    saveQuoteDraftFromForm(quoteForm);
  }
});

app.addEventListener('change', (event) => {
  if (event.target.matches('[data-language-select]')) {
    setPreference('language', event.target.value);
    return;
  }
  if (event.target.matches('[data-theme-select]')) {
    setPreference('theme', event.target.value, false);
    toast('Tema aplicado. Presiona Guardar configuración para confirmar los datos de empresa.');
  }
  if (event.target.matches('[name="business_type"]')) {
    const showDairy = event.target.value === 'asociacion_ganaderos';
    document.querySelectorAll('[data-dairy-settings]').forEach(el => el.classList.toggle('hidden', !showDairy));
  }
  const quoteForm = event.target.closest('[data-form="quote"]');
  if (quoteForm) {
    recalcQuoteForm();
    saveQuoteDraftFromForm(quoteForm);
  }
  if (event.target.matches('[data-logo-input]')) handleLogoFileInput(event.target);
});

window.addEventListener('hashchange', render);
window.addEventListener('pageshow', restoreVisibleApp);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') saveQuoteDraftFromForm(getCurrentQuoteForm());
  if (document.visibilityState === 'visible') restoreVisibleApp();
});

window.addEventListener('pagehide', () => saveQuoteDraftFromForm(getCurrentQuoteForm()));

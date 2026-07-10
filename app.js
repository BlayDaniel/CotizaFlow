const STORAGE_KEY = 'cotizaflow_fase7_local_state_v1';
const config = window.COTIZAFLOW_CONFIG || {};
const PLATFORM_SUPERUSER_EMAIL = String(config.platformSuperuserEmail || 'juan.dmzjob@gmail.com').trim().toLowerCase();
const app = document.getElementById('app');
const REFERRAL_STORAGE_KEY = 'cotizaflow_pending_referral_code_v1';
const QUOTE_DRAFT_STORAGE_KEY = 'cotizaflow_quote_form_draft_v1';
const PREFERENCES_STORAGE_KEY = 'cotizaflow_preferences_v1';
const MILK_RECORDS_STORAGE_KEY = 'cotizaflow_milk_records_v1';
const DAIRY_SETTINGS_STORAGE_KEY = 'cotizaflow_dairy_settings_v1';
const INVOICE_FALLBACK_STORAGE_KEY = 'cotizaflow_invoices_fallback_v1';
const EXPORT_USAGE_STORAGE_KEY = 'cotizaflow_export_usage_v1';

const PLAN_CATALOG = {
  demo: {
    name: 'Demo', price: 0, currency: 'DOP', priceLabel: 'Prueba', quoteLimit: 5, maxQuotesPerMonth: 5, maxClients: 5, maxInvoicesPerMonth: 2, maxExportsPerMonth: 0, users: 1, catalogLimit: 10,
    setupLabel: 'Sin setup', upgradeLabel: 'CRM Básico',
    description: 'Prueba controlada con datos de evaluación, límites fuertes y marca de agua. No está pensado para operar una empresa real.',
    features: ['crm_core','dashboard_basic','clients','quotes','quote_pdf','follow_up','catalog','invoices','company_branding'],
    lockedPdfWatermark: true
  },
  crm_basico: {
    name: 'CRM Básico', price: 2900, currency: 'DOP', priceLabel: 'RD$2,900', quoteLimit: 50, maxQuotesPerMonth: 50, maxClients: 100, maxInvoicesPerMonth: 20, maxExportsPerMonth: 0, users: 2, catalogLimit: 100,
    setupLabel: 'Setup básico desde RD$5,000', upgradeLabel: 'CRM Pro',
    description: 'Para negocios pequeños que necesitan clientes, cotizaciones, seguimiento y facturas comerciales simples.',
    features: ['crm_core','dashboard_basic','clients','quotes','quote_pdf','follow_up','catalog','invoices','company_branding','whatsapp_templates','roles_basic']
  },
  crm_pro: {
    name: 'CRM Pro', price: 6900, currency: 'DOP', priceLabel: 'RD$6,900', quoteLimit: 500, maxQuotesPerMonth: 500, maxClients: 10000, maxInvoicesPerMonth: 500, maxExportsPerMonth: 100, users: 5, catalogLimit: 500,
    setupLabel: 'Setup Pro desde RD$12,000', upgradeLabel: 'CRM Empresa',
    description: 'Plan principal: cotizaciones, facturas comerciales, pagos parciales, cuentas por cobrar, roles y reportes.',
    features: ['crm_core','dashboard_basic','dashboard_advanced','clients','quotes','quote_pdf','follow_up','catalog','invoices','partial_payments','accounts_receivable','roles_basic','roles_advanced','whatsapp_templates','exports_csv','exports_pdf','company_branding','referrals','billing_settings']
  },
  ganadero_pro: {
    name: 'Ganadero Pro', price: 12900, currency: 'DOP', priceLabel: 'RD$12,900', quoteLimit: 500, maxQuotesPerMonth: 500, maxClients: 10000, maxInvoicesPerMonth: 500, maxExportsPerMonth: 200, users: 5, catalogLimit: 700,
    setupLabel: 'Implementación ganadera desde RD$25,000', upgradeLabel: 'CRM Empresa',
    description: 'CRM Pro más control diario de leche, productores, comisiones, resumen mensual, PDF y CSV ganadero.',
    features: ['crm_core','dashboard_basic','dashboard_advanced','clients','quotes','quote_pdf','follow_up','catalog','invoices','partial_payments','accounts_receivable','roles_basic','roles_advanced','whatsapp_templates','exports_csv','exports_pdf','company_branding','referrals','billing_settings','ganadero_module','ganadero_daily_control','ganadero_monthly_summary','ganadero_pdf','ganadero_csv']
  },
  crm_empresa: {
    name: 'CRM Empresa', price: null, currency: 'DOP', priceLabel: 'Personalizado', quoteLimit: 999999, maxQuotesPerMonth: 999999, maxClients: 999999, maxInvoicesPerMonth: 999999, maxExportsPerMonth: 999999, users: 25, catalogLimit: 5000,
    setupLabel: 'Setup personalizado desde RD$25,000', upgradeLabel: 'Contactar ventas',
    description: 'Para múltiples usuarios, varias empresas/sucursales, reportes personalizados e integraciones.',
    features: ['crm_core','dashboard_basic','dashboard_advanced','clients','quotes','quote_pdf','follow_up','catalog','invoices','partial_payments','accounts_receivable','roles_basic','roles_advanced','whatsapp_templates','exports_csv','exports_pdf','company_branding','multi_company','referrals','ganadero_module','ganadero_daily_control','ganadero_monthly_summary','ganadero_pdf','ganadero_csv','custom_reports','integrations','billing_settings']
  }
};

const LEGACY_PLAN_ALIASES = {
  free: 'demo', trial: 'demo', demo: 'demo', starter: 'crm_basico', basic: 'crm_basico', basico: 'crm_basico', crm_basic: 'crm_basico', crm_basico: 'crm_basico', pro: 'crm_pro', enterprise: 'crm_pro', business: 'crm_pro', crm_pro: 'crm_pro', ganadero: 'ganadero_pro', ganadero_pro: 'ganadero_pro', dairy: 'ganadero_pro', custom: 'crm_empresa', empresa: 'crm_empresa', crm_empresa: 'crm_empresa'
};

const FEATURE_DEFINITIONS = {
  crm_core: { label: 'CRM base' }, dashboard_basic: { label: 'Dashboard básico' }, dashboard_advanced: { label: 'Dashboard avanzado' }, clients: { label: 'Clientes' }, quotes: { label: 'Cotizaciones' }, quote_pdf: { label: 'PDF de cotización' }, follow_up: { label: 'Seguimiento' }, catalog: { label: 'Catálogo' }, invoices: { label: 'Facturas comerciales' }, partial_payments: { label: 'Pagos parciales', plan: 'CRM Pro' }, accounts_receivable: { label: 'Cuentas por cobrar', plan: 'CRM Pro' }, roles_basic: { label: 'Roles básicos' }, roles_advanced: { label: 'Roles avanzados', plan: 'CRM Pro' }, whatsapp_templates: { label: 'WhatsApp' }, exports_csv: { label: 'Exportación CSV', plan: 'CRM Pro' }, exports_pdf: { label: 'Exportación PDF' }, company_branding: { label: 'Logo y marca' }, multi_company: { label: 'Multiempresa', plan: 'CRM Empresa' }, referrals: { label: 'Referidos' }, ganadero_module: { label: 'Módulo ganadero', plan: 'Ganadero Pro' }, ganadero_daily_control: { label: 'Control diario ganadero', plan: 'Ganadero Pro' }, ganadero_monthly_summary: { label: 'Resumen mensual ganadero', plan: 'Ganadero Pro' }, ganadero_pdf: { label: 'PDF ganadero', plan: 'Ganadero Pro' }, ganadero_csv: { label: 'CSV ganadero', plan: 'Ganadero Pro' }, custom_reports: { label: 'Reportes personalizados', plan: 'CRM Empresa' }, integrations: { label: 'Integraciones', plan: 'CRM Empresa' }, billing_settings: { label: 'Planes y pagos' }
};

const PAGE_ACCESS_DEFINITIONS = {
  dashboard: { label: 'Dashboard', routes: ['dashboard'] },
  reports: { label: 'Seguimiento', routes: ['reports'] },
  commercial_reports: { label: 'Reportes comerciales', routes: ['commercial-reports'] },
  quotes: { label: 'Cotizaciones', routes: ['quotes','quote-new','quote-edit','quote-view'] },
  invoices: { label: 'Facturas comerciales', routes: ['invoices','invoice-view'] },
  clients: { label: 'Clientes / CRM', routes: ['clients'] },
  catalog: { label: 'Catálogo', routes: ['catalog'] },
  templates: { label: 'Plantillas', routes: ['templates'] },
  milk: { label: 'Control Diario', routes: ['milk'] },
  milk_settlements: { label: 'Liquidaciones ganaderas', routes: ['milk-settlements'] },
  billing: { label: 'Planes y pagos', routes: ['billing'] },
  settings: { label: 'Configuración empresa', routes: ['settings'] },
  affiliates: { label: 'Referidos / afiliados', routes: ['affiliates'] },
  integrations: { label: 'Integraciones', routes: ['integrations'] },
  team: { label: 'Usuarios y roles', routes: ['team'] },
  diagnostics: { label: 'Diagnóstico', routes: ['diagnostics'] },
  plan_qa: { label: 'QA por planes', routes: ['plan-qa'] }
};


const ACTION_GATES = {
  client_create: { permission: 'clients_write', feature: 'clients', limitResource: 'clients', write: true, route: 'billing' },
  client_delete: { permission: 'clients_delete', feature: 'clients', write: true, route: 'billing' },
  quote_create: { permission: 'quotes_write', feature: 'quotes', limitResource: 'quotes', write: true, route: 'billing' },
  quote_update: { permission: 'quotes_write', feature: 'quotes', write: true, route: 'billing' },
  quote_delete: { permission: 'quotes_delete', feature: 'quotes', write: true, route: 'billing' },
  quote_pdf: { permission: 'quotes_read', feature: 'quote_pdf', write: false, route: 'billing' },
  invoice_create: { permission: 'invoices_write', feature: 'invoices', limitResource: 'invoices', write: true, route: 'billing' },
  invoice_issue: { permission: 'invoices_write', feature: 'invoices', write: true, route: 'billing' },
  invoice_void: { permission: 'invoices_void', feature: 'invoices', write: true, route: 'billing' },
  invoice_payment: { permission: 'invoices_payments', feature: 'partial_payments', write: true, route: 'billing' },
  catalog_create: { permission: 'catalog_write', feature: 'catalog', limitResource: 'catalog', write: true, route: 'billing' },
  catalog_delete: { permission: 'catalog_delete', feature: 'catalog', write: true, route: 'billing' },
  templates_create: { permission: 'templates_write', feature: 'whatsapp_templates', write: true, route: 'billing' },
  templates_delete: { permission: 'templates_delete', feature: 'whatsapp_templates', write: true, route: 'billing' },
  milk_create: { permission: 'milk_write', feature: 'ganadero_daily_control', write: true, route: 'ganadero-upgrade' },
  milk_delete: { permission: 'milk_delete', feature: 'ganadero_daily_control', write: true, route: 'ganadero-upgrade' },
  milk_pdf: { permission: 'milk_export', feature: 'ganadero_pdf', limitResource: 'exports', write: false, route: 'ganadero-upgrade' },
  milk_csv: { permission: 'milk_export', feature: 'ganadero_csv', limitResource: 'exports', write: false, route: 'ganadero-upgrade' },
  team_manage: { permission: 'users_manage', feature: 'roles_advanced', write: true, route: 'billing' },
  billing_manage: { permission: 'billing_manage', feature: 'billing_settings', write: false, route: 'billing' }
};

const ACTIVE_BILLING_STATUSES = new Set(['active', 'trial', 'trialing', 'on_trial', 'paid']);
const LIMITED_BILLING_STATUSES = new Set(['past_due']);
const BLOCKED_BILLING_STATUSES = new Set(['suspended', 'cancelled']);



const ROLE_DEFINITIONS = {
  superuser: {
    label: 'Superusuario',
    description: 'Acceso total: empresa, usuarios, ventas, facturas, pagos, catálogo, reportes, referidos e integraciones.',
    permissions: ['*']
  },
  admin: {
    label: 'Administrador',
    description: 'Administra operación diaria, configuración funcional, ventas, facturas, clientes, catálogo y reportes. No administra usuarios ni roles.',
    permissions: ['dashboard_read','reports_read','quotes_read','quotes_write','quotes_delete','clients_read','clients_write','clients_delete','catalog_read','catalog_write','catalog_delete','templates_read','templates_write','templates_delete','invoices_read','invoices_write','invoices_payments','invoices_void','milk_read','milk_write','milk_delete','milk_export','settings_company','billing_manage','affiliates_manage','integrations_manage']
  },
  ventas: {
    label: 'Ventas',
    description: 'Gestiona clientes, cotizaciones, facturas borrador, seguimiento y catálogo en modo operativo.',
    permissions: ['dashboard_read','reports_read','quotes_read','quotes_write','clients_read','clients_write','catalog_read','templates_read','invoices_read','invoices_write']
  },
  operador_diario: {
    label: 'Operador diario',
    description: 'Registra llegadas diarias, productores y consulta el historial operativo.',
    permissions: ['dashboard_read','milk_read','milk_write','clients_read','clients_write']
  },
  contabilidad: {
    label: 'Contabilidad',
    description: 'Gestiona facturas, pagos, reportes, control diario y datos necesarios para cierre.',
    permissions: ['dashboard_read','reports_read','milk_read','milk_export','clients_read','quotes_read','invoices_read','invoices_write','invoices_payments','invoices_void','billing_manage']
  },
  lector: {
    label: 'Solo lectura',
    description: 'Consulta información sin crear, editar o eliminar registros.',
    permissions: ['dashboard_read','reports_read','quotes_read','clients_read','catalog_read','templates_read','milk_read','invoices_read']
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
  invoices: [],
  invoiceStorageMode: 'local',
  billing: null,
  billingEvents: [],
  saasEntitlement: null,
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
  globalUserAccessRows: [],
  diagnosticTargetRows: [],
  diagnosticAuthUser: null,
  platformOverride: null,
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
  activeAuthTab: 'login',
  passwordRecovery: { active: false, email: '', mode: '' }
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
  plan: 'demo',
  active_plan_id: 'demo',
  subscription_status: 'trialing',
  business_type: 'general',
  default_quote_notes: 'Gracias por considerar nuestra propuesta. Esta cotización está sujeta a disponibilidad y vigencia indicada.',
  default_terms: '',
  default_whatsapp_template: '',
  logo_position: 'right',
  theme_preference: 'white',
  default_milk_price_per_liter: 0,
  default_milk_commission_rate: 0,
  invoice_prefix: 'F-',
  next_invoice_number: 1,
  default_invoice_due_days: 15,
  default_invoice_notes: 'Gracias por su compra. Esta factura comercial está sujeta a los términos acordados.',
  default_invoice_terms: '',
  invoice_document_label: 'Factura comercial interna',
  fiscal_integration_status: 'not_enabled',
  fiscal_provider: '',
  default_fiscal_receipt_type: 'none',
  invoice_fiscal_mode: 'commercial_internal',
  payment_provider: 'manual',
  current_period_start: '',
  plan_current_period_end: '',
  next_billing_date: '',
  last_payment_status: '',
  manual_payment_method: '',
  billing_internal_notes: '',
  setup_fee_amount: 0,
  setup_status: 'not_required'
};

const localDefaultState = {
  session: null,
  company: { ...defaultCompany },
  clients: [],
  quotes: [],
  invoices: [],
  invoiceStorageMode: 'local',
  billing: null,
  billingEvents: [],
  saasEntitlement: null,
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
  globalUserAccessRows: [],
  diagnosticTargetRows: [],
  diagnosticAuthUser: null,
  platformOverride: null,
  currentMember: null,
  teamStorageMode: 'local',
  milkRecords: [],
  milkStorageMode: 'local',
  milkFilters: { month: currentMonthValue() },
  prefillMilkClientId: '',
  preferences: loadPreferences(),
  reportFilters: { period: 'all', status: 'all', attention: 'all' },
  clientFilters: { status: 'all', search: '' },
  passwordRecovery: { active: false, email: '', mode: '' }
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
    settings: 'Configuración', milkControl: 'Control Diario', invoices: 'Facturas comerciales', company: 'Empresa', billing: 'Planes y pagos', affiliates: 'Referidos', integrations: 'Integraciones', users: 'Usuarios y roles',
    back: 'Regresar', theme: 'Temas', white: 'White', black: 'Black', saveSettings: 'Guardar configuración'
  },
  en: {
    language: 'Language', spanish: 'Spanish', english: 'English', dashboard: 'Dashboard', quotes: 'Quotes',
    newQuote: 'New quote', followup: 'Follow-up', clients: 'Client CRM', catalog: 'Catalog', templates: 'Templates',
    settings: 'Settings', milkControl: 'Daily control', invoices: 'Commercial invoices', company: 'Company', billing: 'Plans & payments', affiliates: 'Referrals', integrations: 'Integrations', users: 'Users & roles',
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
  const notice = subscriptionStatusNotice();
  return `
    <div class="utility-bar">
      <div>
        <div class="utility-title">${escapeHtml(state.company?.name || 'CotizaFlow')}</div>
        ${notice ? `<div class="subscription-notice">${escapeHtml(notice)}</div>` : ''}
      </div>
      <div class="utility-actions">${currentRoleBadge()}${renderLanguageSelector()}</div>
    </div>
  `;
}


function salesContactUrl(planKey = '') {
  const plan = PLAN_CATALOG[normalizePlanKey(planKey)] || null;
  const companyName = state.company?.name || 'mi empresa';
  const message = `Hola, quiero activar ${plan?.name || 'un plan de CotizaFlow'} para ${companyName}.`;
  const phone = String(config.salesWhatsapp || config.salesPhone || '').replace(/\D/g, '');
  if (phone) return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  const subject = encodeURIComponent(`CotizaFlow - ${plan?.name || 'Planes'}`);
  return `mailto:${config.salesEmail || 'ventas@cotizaflow.app'}?subject=${subject}&body=${encodeURIComponent(message)}`;
}

function renderUpgradeActions(planKey = '') {
  return `
    <div class="actions upgrade-actions">
      <button class="btn primary" data-route="billing">Ver planes</button>
      <a class="btn secondary" href="${escapeHtml(salesContactUrl(planKey))}" target="_blank" rel="noopener">Contactar por WhatsApp</a>
      <button class="btn ghost" data-route="dashboard">Volver</button>
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

function isPlatformSuperuserEmail(email) {
  if (mode === 'local') return true;
  return normalizeEmail(email) === PLATFORM_SUPERUSER_EMAIL;
}

function isPlatformSuperuser() {
  return Boolean(state.session?.email && isPlatformSuperuserEmail(state.session.email));
}

function isCompanyOwner() {
  if (mode === 'local') return true;
  return Boolean(state.session?.id && state.company?.owner_user_id && String(state.company.owner_user_id) === String(state.session.id));
}

function currentTeamMember() {
  const email = normalizeEmail(state.session?.email || '');
  return (state.teamMembers || []).find(member => {
    if (String(member.status || 'active') !== 'active') return false;
    if (member.user_id && state.session?.id && String(member.user_id) === String(state.session.id)) return true;
    return email && normalizeEmail(member.email) === email;
  }) || state.currentMember || null;
}

function normalizeAccessOverride(value) {
  if (!value) return { allow: [], deny: [] };
  let parsed = value;
  if (typeof value === 'string') {
    try { parsed = JSON.parse(value); } catch (_error) { parsed = {}; }
  }
  const allow = Array.isArray(parsed.allow) ? parsed.allow.map(String) : [];
  const deny = Array.isArray(parsed.deny) ? parsed.deny.map(String) : [];
  return { allow: [...new Set(allow)], deny: [...new Set(deny)] };
}

function memberPermissionOverride(member, permission) {
  const overrides = normalizeAccessOverride(member?.permission_overrides);
  if (overrides.deny.includes(permission)) return 'deny';
  if (overrides.allow.includes(permission)) return 'allow';
  return 'inherit';
}

function memberFeatureOverride(member, featureKey) {
  const overrides = normalizeAccessOverride(member?.feature_overrides);
  if (overrides.deny.includes(featureKey)) return 'deny';
  if (overrides.allow.includes(featureKey)) return 'allow';
  return 'inherit';
}

function memberPageOverride(member, pageKey) {
  const overrides = normalizeAccessOverride(member?.page_overrides);
  if (overrides.deny.includes(pageKey)) return 'deny';
  if (overrides.allow.includes(pageKey)) return 'allow';
  return 'inherit';
}

function platformOverrideFor(kind, key) {
  const access = state.platformOverride || {};
  const source = kind === 'permission' ? access.permission_overrides : kind === 'feature' ? access.feature_overrides : access.page_overrides;
  const overrides = normalizeAccessOverride(source);
  if (overrides.deny.includes(key)) return 'deny';
  if (overrides.allow.includes(key)) return 'allow';
  return 'inherit';
}

function isCurrentUserGloballyInactive() {
  if (isPlatformSuperuser()) return false;
  return String(state.platformOverride?.status || 'active') !== 'active';
}

function allPageKeys() {
  return Object.keys(PAGE_ACCESS_DEFINITIONS).sort();
}

function pageLabel(pageKey) {
  return PAGE_ACCESS_DEFINITIONS[pageKey]?.label || pageKey;
}

function routeToPageKey(route = getRoute()) {
  const clean = String(route || 'dashboard');
  for (const [key, def] of Object.entries(PAGE_ACCESS_DEFINITIONS)) {
    if ((def.routes || []).some(prefix => clean === prefix || clean.startsWith(prefix + '/'))) return key;
  }
  return clean === 'ganadero-upgrade' || clean === 'invoices-upgrade' ? clean : 'dashboard';
}

function canAccessPage(pageKey) {
  if (!pageKey) return true;
  if (isPlatformSuperuser()) return true;
  if (isCurrentUserGloballyInactive()) return false;
  const key = String(pageKey);
  const globalOverride = platformOverrideFor('page', key);
  if (globalOverride === 'deny') return false;
  if (globalOverride === 'allow') return true;
  const memberOverride = memberPageOverride(currentTeamMember(), key);
  if (memberOverride === 'deny') return false;
  if (memberOverride === 'allow') return true;
  return true;
}

function allPermissionKeys() {
  const set = new Set();
  Object.values(ROLE_DEFINITIONS).forEach(role => (role.permissions || []).forEach(permission => {
    if (permission !== '*') set.add(permission);
  }));
  return [...set].sort();
}

function getEffectiveRoleKey() {
  if (!state.session) return 'lector';
  if (isPlatformSuperuser()) return 'superuser';
  const member = currentTeamMember();
  let roleKey = normalizeRole(member?.role || state.currentMember?.role || (isCompanyOwner() ? 'admin' : 'lector'));
  if (roleKey === 'superuser') roleKey = 'admin';
  return roleKey;
}

function getEffectiveRole() {
  return ROLE_DEFINITIONS[getEffectiveRoleKey()] || ROLE_DEFINITIONS.lector;
}

function can(permission) {
  if (permission === 'users_manage') return isPlatformSuperuser();
  if (isCurrentUserGloballyInactive()) return false;
  const globalOverride = platformOverrideFor('permission', permission);
  if (globalOverride === 'deny') return false;
  if (globalOverride === 'allow') return true;
  const member = currentTeamMember();
  const override = memberPermissionOverride(member, permission);
  if (override === 'deny') return false;
  if (override === 'allow') return true;
  const role = getEffectiveRole();
  return role.permissions.includes('*') || role.permissions.includes(permission);
}

function firstSettingsRoute() {
  if (can('settings_company') && canAccessPage('settings')) return 'settings';
  if (can('billing_manage') && canAccessPage('billing')) return 'billing';
  if (can('users_manage') && canAccessPage('team')) return 'team';
  if (can('affiliates_manage') && canAccessPage('affiliates')) return 'affiliates';
  if (can('integrations_manage') && canAccessPage('integrations')) return 'integrations';
  return 'dashboard';
}

function requirePermission(permission, message = 'Tu rol no tiene permiso para realizar esta acción.') {
  if (can(permission)) return true;
  toast(message);
  return false;
}

function renderAccessDenied(message = 'Tu usuario no tiene acceso a esta pantalla.') {
  return `
    <section class="card access-denied">
      <h1>Acceso restringido</h1>
      <p>${escapeHtml(message)}</p><p class="help">Rol actual: <strong>${escapeHtml(roleLabel(getEffectiveRoleKey()))}</strong>.</p>
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
      if (event === 'TOKEN_REFRESHED') {
        if (session?.user) state.session = normalizeSession(session.user);
        return;
      }

      if (event === 'PASSWORD_RECOVERY' && session?.user) {
        state.session = normalizeSession(session.user);
        state.passwordRecovery = { active: true, email: session.user.email || '', mode: 'link' };
        state.activeAuthTab = 'reset';
        state.authMessage = 'Correo validado. Introduce una contraseña nueva para terminar la recuperación.';
        state.loading = false;
        setRoute('auth');
        render();
        return;
      }

      if (event === 'USER_UPDATED') {
        if (session?.user) state.session = normalizeSession(session.user);
        return;
      }

      // Supabase recomienda no esperar queries dentro del callback de Auth.
      // Se difiere la carga para evitar que la pantalla quede fija en "Cargando...".
      setTimeout(async () => {
        try {
          if (session?.user) {
            state.session = normalizeSession(session.user);
            if (state.passwordRecovery?.active) {
              state.loading = false;
              render();
              return;
            }
            await loadRemoteData();
          } else {
            state.loading = false;
            state.session = null;
            state.company = null;
            state.clients = [];
            state.quotes = [];
            state.passwordRecovery = { active: false, email: '', mode: '' };
            render();
          }
        } catch (error) {
          console.error(error);
          state.loading = false;
          state.authMessage = friendlyAuthError(error);
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
      invoices: (parsed.invoices || []).map(normalizeInvoice),
      invoiceStorageMode: 'local',
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
    invoices: state.invoices,
    invoiceStorageMode: state.invoiceStorageMode,
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


function friendlyAuthError(error) {
  const raw = String(error?.message || error || '').trim();
  const lower = raw.toLowerCase();
  if (!raw) return 'No se pudo autenticar.';
  if (lower.includes('invalid login credentials')) return 'Correo o contraseña incorrectos. Si el usuario fue creado por un administrador, primero debe crear cuenta con ese correo o usar “Olvidé mi contraseña” si ya existe en Auth.';
  if (lower.includes('email not confirmed')) return 'El correo todavía no está confirmado. Revisa el correo de confirmación o desactiva Confirm email mientras estás en desarrollo.';
  if (lower.includes('signup disabled')) return 'El registro está desactivado en Supabase Auth. Activa nuevos registros o crea usuarios desde el panel de Supabase.';
  if (lower.includes('for security purposes')) return 'Supabase limitó el envío por seguridad. Espera unos segundos antes de solicitar otro correo.';
  if (lower.includes('user already registered') || lower.includes('already registered')) return 'Ese correo ya está registrado. Usa Entrar o recupera la contraseña.';
  return raw;
}

function recoveryRedirectUrl() {
  return appBaseUrl();
}

function isPasswordStrongEnough(password) {
  return String(password || '').length >= 8;
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
    await loadPlatformOverride();
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
    await loadSaasEntitlement();
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
    await loadInvoices();
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
      plan: 'demo',
      active_plan_id: 'demo',
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
      role: isPlatformSuperuserEmail(state.session.email) ? 'superuser' : 'admin',
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
    role: isPlatformSuperuserEmail(state.session?.email) ? 'superuser' : 'admin',
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


async function loadPlatformOverride() {
  state.platformOverride = null;
  if (mode !== 'supabase' || !supabaseClient || !state.session?.email) return;
  try {
    const { data, error } = await supabaseClient
      .from('platform_user_overrides')
      .select('*')
      .eq('email', normalizeEmail(state.session.email))
      .maybeSingle();
    if (error) throw error;
    state.platformOverride = data || null;
  } catch (error) {
    console.warn('Overrides globales no disponibles. Ejecuta schema_phase10q_global_license_access.sql:', error.message || error);
    state.platformOverride = null;
  }
}

async function loadSaasEntitlement() {
  state.saasEntitlement = null;
  if (mode !== 'supabase' || !supabaseClient || !state.company?.id) return;
  try {
    const { data, error } = await supabaseClient
      .from('company_saas_entitlements')
      .select('*')
      .eq('company_id', state.company.id)
      .maybeSingle();
    if (error) throw error;
    state.saasEntitlement = data || null;
  } catch (error) {
    console.warn('Entitlements SaaS pendientes. Ejecuta schema_phase10a_saas_plans.sql:', error.message || error);
    state.saasEntitlement = null;
  }
}

function applySaasEntitlementToPlan(planKey, plan) {
  const entitlement = state.saasEntitlement;
  if (!entitlement || normalizePlanKey(entitlement.plan_id) !== planKey) return plan;
  return {
    ...plan,
    name: entitlement.plan_name || plan.name,
    price: entitlement.monthly_price ?? plan.price,
    currency: entitlement.currency || plan.currency,
    maxClients: Number(entitlement.max_clients ?? plan.maxClients),
    maxQuotesPerMonth: Number(entitlement.max_quotes_per_month ?? plan.maxQuotesPerMonth),
    quoteLimit: Number(entitlement.max_quotes_per_month ?? plan.quoteLimit),
    maxInvoicesPerMonth: Number(entitlement.max_invoices_per_month ?? plan.maxInvoicesPerMonth),
    maxExportsPerMonth: Number(entitlement.max_exports_per_month ?? plan.maxExportsPerMonth),
    users: Number(entitlement.max_users ?? plan.users),
    catalogLimit: Number(entitlement.catalog_limit ?? plan.catalogLimit)
  };
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

function getRawBillingStatus() {
  const stored = String(state.saasEntitlement?.subscription_status || state.billing?.subscription_status || state.billing?.status || state.company?.subscription_status || 'trialing').toLowerCase();
  const normalized = normalizeSubscriptionStatus(stored);
  const end = state.billing?.current_period_end || state.company?.plan_current_period_end;
  if ((normalized === 'active' || normalized === 'trial') && end) {
    const endTime = new Date(end).getTime();
    if (!Number.isNaN(endTime) && endTime < Date.now()) return 'past_due';
  }
  return stored;
}

function normalizeSubscriptionStatus(statusValue) {
  const status = String(statusValue || 'trialing').toLowerCase();
  if (['trialing', 'on_trial', 'trial'].includes(status)) return 'trial';
  if (['active', 'paid'].includes(status)) return 'active';
  if (['past_due', 'payment_failed', 'unpaid'].includes(status)) return 'past_due';
  if (['suspended', 'paused', 'blocked'].includes(status)) return 'suspended';
  if (['cancelled', 'canceled', 'inactive'].includes(status)) return 'cancelled';
  return status;
}

function hasUsableSubscription() {
  const rawStatus = getRawBillingStatus();
  const status = normalizeSubscriptionStatus(rawStatus);
  const periodEnd = state.billing?.current_period_end || state.company?.plan_current_period_end;
  if (ACTIVE_BILLING_STATUSES.has(rawStatus) || ['trial','active'].includes(status)) return true;
  if (status === 'past_due') return true;
  if (periodEnd && new Date(periodEnd).getTime() > Date.now() && !BLOCKED_BILLING_STATUSES.has(status)) return true;
  return false;
}

function hasWritableSubscription() {
  const status = normalizeSubscriptionStatus(getRawBillingStatus());
  if (['suspended', 'cancelled'].includes(status)) return false;
  return hasUsableSubscription();
}

function isSubscriptionBlocked() {
  return BLOCKED_BILLING_STATUSES.has(normalizeSubscriptionStatus(getRawBillingStatus()));
}

function isSubscriptionPastDue() {
  return normalizeSubscriptionStatus(getRawBillingStatus()) === 'past_due';
}

function subscriptionBlockMessage() {
  const status = normalizeSubscriptionStatus(getRawBillingStatus());
  if (status === 'suspended') return 'La suscripción está suspendida. Puedes consultar información existente, configuración y planes, pero no crear ni modificar registros.';
  if (status === 'cancelled') return 'La suscripción está cancelada. Puedes consultar información existente, configuración y planes, pero no crear ni modificar registros.';
  return 'La suscripción está bloqueada. Solo puedes consultar información existente.';
}

function subscriptionStatusNotice() {
  const status = normalizeSubscriptionStatus(getRawBillingStatus());
  if (status === 'past_due') return 'Pago pendiente: el sistema sigue activo, pero debes regularizar el plan para evitar suspensión.';
  if (status === 'suspended') return 'Suscripción suspendida: operación en modo solo lectura. Actualiza el plan o registra el pago para reactivar.';
  if (status === 'cancelled') return 'Suscripción cancelada: operación en modo solo lectura. Actualiza el plan para reactivar.';
  return '';
}


function isDemoPlan() {
  return getEffectivePlanKey() === 'demo';
}

function demoRestrictionNotice() {
  if (!isDemoPlan()) return '';
  return 'Demo está limitado para evaluación: 5 clientes, 5 cotizaciones, 2 facturas comerciales de prueba, sin CSV ni módulo ganadero real, y PDFs con marca de agua.';
}

function exportUsageKey() {
  const companyId = state.company?.id || 'local-company';
  const userId = state.session?.id || 'local-user';
  return `${EXPORT_USAGE_STORAGE_KEY}:${userId}:${companyId}`;
}

function loadExportUsageEvents() {
  try {
    const raw = localStorage.getItem(exportUsageKey());
    return raw ? JSON.parse(raw) : [];
  } catch (_error) {
    return [];
  }
}

function saveExportUsageEvents(events) {
  try {
    localStorage.setItem(exportUsageKey(), JSON.stringify(events || []));
  } catch (_error) {}
}

function getMonthlyExportCount() {
  const start = getMonthStartISO();
  return loadExportUsageEvents().filter(event => String(event.created_at || '') >= start).reduce((sum, event) => sum + Number(event.quantity || 1), 0);
}

async function recordExportUsage(eventKey = 'export') {
  const event = { event_key: eventKey, resource_key: 'exports', quantity: 1, created_at: new Date().toISOString() };
  const events = loadExportUsageEvents();
  events.push(event);
  saveExportUsageEvents(events);
  if (mode === 'supabase' && supabaseClient && state.company?.id) {
    try {
      await supabaseClient.from('company_usage_events').insert({
        company_id: state.company.id,
        user_id: state.session?.id || null,
        event_key: eventKey,
        resource_key: 'exports',
        quantity: 1,
        metadata: { route: getRoute(), plan: getEffectivePlanKey() }
      });
    } catch (error) {
      console.warn('No se pudo registrar uso de exportación. Ejecuta schema_phase10c si falta company_usage_events:', error.message || error);
    }
  }
}


function normalizePlanKey(planValue) {
  const plan = String(planValue || 'demo').toLowerCase().trim();
  return LEGACY_PLAN_ALIASES[plan] || (PLAN_CATALOG[plan] ? plan : 'demo');
}

function getConfiguredPlanKey() {
  // Prioridad compatible: la suscripción editada manualmente y companies son la fuente operativa.
  // company_saas_entitlements puede quedar desfasada si el SQL anterior no tiene trigger; por eso va al final.
  return normalizePlanKey(
    state.billing?.plan_id ||
    state.billing?.plan ||
    state.company?.active_plan_id ||
    state.company?.plan ||
    state.saasEntitlement?.plan_id ||
    'demo'
  );
}

function getEffectivePlanKey() {
  const plan = getConfiguredPlanKey();
  if (isSubscriptionBlocked()) return 'demo';
  if (plan === 'crm_empresa') return hasUsableSubscription() ? 'crm_empresa' : 'demo';
  return hasUsableSubscription() ? (PLAN_CATALOG[plan] ? plan : 'demo') : 'demo';
}

function getEffectivePlan() {
  const planKey = getEffectivePlanKey();
  return applySaasEntitlementToPlan(planKey, PLAN_CATALOG[planKey] || PLAN_CATALOG.demo);
}

function planFeatureSet(planKey = getEffectivePlanKey()) {
  return new Set((PLAN_CATALOG[planKey]?.features || []).map(String));
}

function canUseFeature(featureKey) {
  if (!featureKey) return true;
  if (isCurrentUserGloballyInactive()) return false;
  const key = String(featureKey);
  const globalOverride = platformOverrideFor('feature', key);
  if (globalOverride === 'deny') return false;
  if (globalOverride === 'allow') return true;
  const override = memberFeatureOverride(currentTeamMember(), key);
  if (override === 'deny') return false;
  if (override === 'allow') return true;
  const effectivePlan = getEffectivePlanKey();
  if (effectivePlan === 'crm_empresa') return true;
  return planFeatureSet(effectivePlan).has(key);
}

function featureUpgradePlan(featureKey) {
  return FEATURE_DEFINITIONS[featureKey]?.plan || getEffectivePlan().upgradeLabel || 'un plan superior';
}

function renderFeatureLocked(featureKey, title = 'Función no incluida en tu plan', description = '') {
  const feature = FEATURE_DEFINITIONS[featureKey]?.label || 'esta función';
  const planName = featureUpgradePlan(featureKey);
  const text = description || `${feature} está disponible en ${planName}. Actualiza tu plan para activar esta función.`;
  const planKey = planKeyByCommercialName(planName);
  return `
    <section class="card access-denied upgrade-card">
      <span class="badge locked">Disponible en ${escapeHtml(planName)}</span>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(text)}</p>
      <div class="upgrade-value-grid">
        <div><strong>Valor comercial</strong><span>${escapeHtml(upgradeValueText(featureKey))}</span></div>
        <div><strong>Plan actual</strong><span>${escapeHtml(getEffectivePlan().name)}</span></div>
        <div><strong>Estado</strong><span>${escapeHtml(normalizeSubscriptionStatus(getRawBillingStatus()))}</span></div>
      </div>
      ${renderUpgradeActions(planKey)}
    </section>
  `;
}


function isDairyBusiness() {
  return state.company?.business_type === 'asociacion_ganaderos';
}

function canOperateGanadero() {
  if (!isDairyBusiness()) return false;
  if (!can('milk_read')) return false;
  // Ganadero Pro y CRM Empresa habilitan el dashboard ganadero, seguimiento y Control Diario.
  // Se usa getEffectivePlanKey(), que ya evita entitlements viejos y respeta suspensión/cancelación.
  const planKey = getEffectivePlanKey();
  return ['ganadero_pro', 'crm_empresa'].includes(planKey) && canUseFeature('ganadero_module');
}

function renderGanaderoUpgrade() {
  const plan = getEffectivePlan();
  const status = normalizeSubscriptionStatus(getRawBillingStatus());
  const isDairy = isDairyBusiness();
  const reason = !isDairy
    ? 'Este módulo se activa para empresas configuradas como Asociación Ganaderos.'
    : status === 'suspended' || status === 'cancelled'
      ? 'La cuenta puede consultar información existente, pero no operar el módulo hasta reactivar la suscripción.'
      : 'El tipo de negocio es Asociación Ganaderos, pero el plan actual no incluye el módulo vertical Ganadero Pro.';
  return `
    <section class="card access-denied upgrade-card ganadero-upgrade-card">
      <span class="badge locked">Disponible en Ganadero Pro</span>
      <h1>Activa Ganadero Pro</h1>
      <p>${escapeHtml(reason)}</p>
      <div class="upgrade-value-grid">
        <div><strong>Control diario</strong><span>Registra litros por productor, precio por litro y comisión.</span></div>
        <div><strong>Cierre mensual</strong><span>Genera resumen por productor, neto a pagar, PDF y CSV.</span></div>
        <div><strong>CRM conectado</strong><span>Cada productor conserva historial en Clientes.</span></div>
        <div><strong>Plan actual</strong><span>${escapeHtml(plan.name)} · ${escapeHtml(status)}</span></div>
      </div>
      <div class="notice info">
        Ganadero Pro no reemplaza la facturación fiscal. Opera la llegada de leche, liquidaciones internas y ventas comerciales de insumos desde el CRM.
      </div>
      ${renderUpgradeActions('ganadero_pro')}
      ${!isDairy ? `<button class="btn secondary" data-route="settings">Configurar tipo de negocio</button>` : ''}
    </section>
  `;
}

function planKeyByCommercialName(name = '') {
  const normalized = String(name).toLowerCase();
  if (normalized.includes('ganadero')) return 'ganadero_pro';
  if (normalized.includes('empresa')) return 'crm_empresa';
  if (normalized.includes('pro')) return 'crm_pro';
  if (normalized.includes('básico') || normalized.includes('basico')) return 'crm_basico';
  return getEffectivePlanKey();
}

function upgradeValueText(featureKey) {
  const messages = {
    invoices: 'Convierte cotizaciones en facturas comerciales y controla ventas pendientes.',
    partial_payments: 'Registra abonos y saldos sin depender de hojas de cálculo.',
    accounts_receivable: 'Identifica clientes con deuda, facturas vencidas y dinero por cobrar.',
    roles_advanced: 'Separa permisos entre ventas, contabilidad, operación diaria y lectura.',
    exports_csv: 'Lleva reportes a Excel, contabilidad o análisis externo.',
    ganadero_module: 'Controla productores, entregas diarias, comisiones y liquidaciones mensuales.',
    ganadero_daily_control: 'Registra litros por productor sin duplicar clientes del CRM.',
    integrations: 'Conecta pagos, automatizaciones y procesos externos cuando el negocio crece.'
  };
  return messages[featureKey] || 'Función premium para operar con más control y menos trabajo manual.';
}


function evaluateActionGate(actionKey, overrides = {}) {
  const gate = { ...(ACTION_GATES[actionKey] || {}), ...overrides };
  if (gate.permission && !can(gate.permission)) {
    return { ok: false, code: 'role', route: 'dashboard', message: gate.permissionMessage || 'Tu rol no tiene permiso para realizar esta acción.' };
  }
  if (gate.feature && !canUseFeature(gate.feature)) {
    const feature = FEATURE_DEFINITIONS[gate.feature]?.label || 'esta función';
    return { ok: false, code: 'feature', feature: gate.feature, route: gate.route || 'billing', message: gate.featureMessage || `${feature} está disponible en ${featureUpgradePlan(gate.feature)}.` };
  }
  if (gate.write && isSubscriptionBlocked() && !gate.allowWhenBlocked) {
    return { ok: false, code: 'subscription', route: 'billing', message: subscriptionBlockMessage() };
  }
  if (gate.limitResource && !gate.skipLimit && resourceLimitReached(gate.limitResource)) {
    return { ok: false, code: 'limit', resource: gate.limitResource, route: 'billing', message: resourceLimitMessage(gate.limitResource) };
  }
  return { ok: true };
}

function guardAction(actionKey, overrides = {}) {
  const result = evaluateActionGate(actionKey, overrides);
  if (result.ok) return true;
  toast(result.message);
  if (result.route && result.route !== getRoute()) {
    setRoute(result.route);
    render();
  }
  return false;
}

function renderActionLocked(actionKey, overrides = {}, title = 'Acción no disponible') {
  const result = evaluateActionGate(actionKey, overrides);
  if (result.ok) return '';
  if (result.code === 'feature' && result.feature) return renderFeatureLocked(result.feature, title, result.message);
  if (result.code === 'limit') return renderResourceLimitLocked(result.resource, title);
  if (result.code === 'subscription') return renderSubscriptionLocked();
  return renderAccessDenied();
}

function renderResourceLimitLocked(resourceKey, title = 'Límite alcanzado') {
  const usage = getPlanUsage();
  const resource = usage.resources[resourceKey];
  const label = resource?.label || 'este recurso';
  const limitText = resource && Number.isFinite(resource.limit) ? `${resource.used}/${resource.limit}` : `${resource?.used || 0}`;
  return `
    <section class="card access-denied upgrade-card">
      <span class="badge locked">Límite del plan</span>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(label)} llegó al límite del plan ${escapeHtml(usage.plan.name)} (${escapeHtml(limitText)}). Actualiza tu plan para continuar operando.</p>
      <div class="actions">
        <button class="btn primary" data-route="billing">Actualizar plan</button>
        <button class="btn secondary" data-route="dashboard">Volver al Dashboard</button>
      </div>
    </section>
  `;
}

function renderSubscriptionLocked() {
  return `
    <section class="card access-denied upgrade-card">
      <span class="badge danger">Cuenta bloqueada</span>
      <h1>Operación en modo solo lectura</h1>
      <p>${escapeHtml(subscriptionBlockMessage())}</p>
      <div class="actions">
        <button class="btn primary" data-route="billing">Ver planes y pagos</button>
        <button class="btn secondary" data-route="dashboard">Volver al Dashboard</button>
      </div>
    </section>
  `;
}

function resourceLimitReached(resourceKey) {
  const usage = getPlanUsage();
  const resource = usage.resources[resourceKey];
  if (!resource) return false;
  if (!Number.isFinite(resource.limit)) return false;
  return resource.used >= resource.limit;
}

function resourceLimitMessage(resourceKey) {
  const usage = getPlanUsage();
  const resource = usage.resources[resourceKey];
  if (!resource) return 'Llegaste al límite de tu plan.';
  return `Llegaste al límite de ${resource.label.toLowerCase()} del plan ${usage.plan.name}.`;
}

function getMonthStartISO() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
}

function getMonthlyQuoteCount() {
  const start = getMonthStartISO();
  return (state.quotes || []).filter(q => !q.created_at || String(q.created_at) >= start).length;
}

function getMonthlyInvoiceCount() {
  const start = getMonthStartISO();
  return (state.invoices || []).filter(inv => !inv.created_at || String(inv.created_at) >= start).length;
}

function normalizeFiniteLimit(value) {
  const limit = Number(value ?? 0);
  return limit >= 999999 ? Infinity : Math.max(0, limit);
}

function usageResource(label, used, limitValue) {
  const limit = normalizeFiniteLimit(limitValue);
  const remaining = Number.isFinite(limit) ? Math.max(0, limit - used) : Infinity;
  const percent = Number.isFinite(limit) && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return { label, used, limit, remaining, percent };
}

function getPlanUsage() {
  const planKey = getEffectivePlanKey();
  const plan = getEffectivePlan();
  const resources = {
    clients: usageResource('Clientes', (state.clients || []).length, plan.maxClients),
    quotes: usageResource('Cotizaciones mensuales', getMonthlyQuoteCount(), plan.maxQuotesPerMonth ?? plan.quoteLimit),
    invoices: usageResource('Facturas comerciales mensuales', getMonthlyInvoiceCount(), plan.maxInvoicesPerMonth),
    catalog: usageResource('Items de catálogo', activeProductsServices().length, plan.catalogLimit),
    users: usageResource('Usuarios', Math.max(1, (state.teamMembers || []).filter(m => String(m.status || 'active') === 'active').length || 1), plan.users),
    exports: usageResource('Exportaciones mensuales', getMonthlyExportCount(), plan.maxExportsPerMonth)
  };
  const quoteUsage = resources.quotes;
  return { planKey, plan, resources, used: quoteUsage.used, limit: quoteUsage.limit, remaining: quoteUsage.remaining, percent: quoteUsage.percent };
}

function canCreateQuote() {
  return evaluateActionGate('quote_create').ok;
}

function canCreateClient() {
  return evaluateActionGate('client_create').ok;
}

function canCreateInvoice() {
  return evaluateActionGate('invoice_create').ok;
}

function planStatusText() {
  const plan = getEffectivePlan();
  const rawStatus = getRawBillingStatus();
  return `${plan.name} · ${normalizeSubscriptionStatus(rawStatus)}`;
}

function safeDateOnly(value) {
  if (!value) return '';
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function displayDate(value, fallback = 'Pendiente') {
  const date = safeDateOnly(value);
  return date || fallback;
}

function daysUntil(value) {
  const date = safeDateOnly(value);
  if (!date) return null;
  const target = new Date(`${date}T23:59:59`);
  if (Number.isNaN(target.getTime())) return null;
  return Math.ceil((target.getTime() - Date.now()) / 86400000);
}

function getBillingSnapshot() {
  const planKey = getEffectivePlanKey();
  const catalogPlan = getEffectivePlan();
  const rawStatus = getRawBillingStatus();
  const status = normalizeSubscriptionStatus(rawStatus);
  const currentPeriodStart = state.billing?.current_period_start || state.company?.current_period_start || '';
  const currentPeriodEnd = state.billing?.current_period_end || state.company?.plan_current_period_end || '';
  const nextBillingDate = state.billing?.next_billing_date || state.company?.next_billing_date || currentPeriodEnd || '';
  const paymentProvider = state.billing?.payment_provider || state.company?.payment_provider || config.billingProvider || 'manual';
  const manualPaymentMethod = state.billing?.manual_payment_method || state.company?.manual_payment_method || '';
  const lastPaymentStatus = state.billing?.last_payment_status || state.company?.last_payment_status || '';
  const internalNotes = state.billing?.internal_notes || state.company?.billing_internal_notes || '';
  const setupFeeAmount = Number(state.billing?.setup_fee_amount ?? state.company?.setup_fee_amount ?? 0);
  const setupStatus = state.billing?.setup_status || state.company?.setup_status || 'not_required';
  const remainingDays = daysUntil(currentPeriodEnd || nextBillingDate);
  return { planKey, plan: catalogPlan, rawStatus, status, currentPeriodStart, currentPeriodEnd, nextBillingDate, paymentProvider, manualPaymentMethod, lastPaymentStatus, internalNotes, setupFeeAmount, setupStatus, remainingDays };
}

function subscriptionStatusLabel(status = normalizeSubscriptionStatus(getRawBillingStatus())) {
  return ({ trial: 'Prueba', active: 'Activo', past_due: 'Pago pendiente', suspended: 'Suspendido', cancelled: 'Cancelado' })[status] || status;
}

function subscriptionStatusClass(status = normalizeSubscriptionStatus(getRawBillingStatus())) {
  if (status === 'active' || status === 'trial') return 'success';
  if (status === 'past_due') return 'warning';
  if (status === 'suspended' || status === 'cancelled') return 'danger';
  return 'muted';
}

function billingHealthText(snapshot = getBillingSnapshot()) {
  if (snapshot.status === 'suspended') return 'Cuenta suspendida. El sistema queda en solo lectura hasta registrar pago o reactivar el plan.';
  if (snapshot.status === 'cancelled') return 'Cuenta cancelada. Puedes consultar datos existentes y acceder a Planes y pagos.';
  if (snapshot.status === 'past_due') return 'Pago pendiente. Conviene regularizar antes de suspender la operación.';
  if (snapshot.status === 'trial') return 'Prueba activa con límites. Actualiza antes de operar una empresa real.';
  if (snapshot.remainingDays !== null && snapshot.remainingDays <= 5) return `Plan activo. La próxima renovación vence en ${snapshot.remainingDays} día${snapshot.remainingDays === 1 ? '' : 's'}.`;
  return 'Plan activo. La operación comercial puede continuar según los límites contratados.';
}

function renderBillingHealthCard() {
  const snapshot = getBillingSnapshot();
  const badgeClass = subscriptionStatusClass(snapshot.status);
  const daysText = snapshot.remainingDays === null ? 'Sin vencimiento definido' : snapshot.remainingDays < 0 ? `${Math.abs(snapshot.remainingDays)} día(s) vencido` : `${snapshot.remainingDays} día(s) restantes`;
  return `
    <section class="card billing-health-card ${badgeClass}">
      <div class="billing-health-top">
        <div>
          <span class="badge ${badgeClass}">${escapeHtml(subscriptionStatusLabel(snapshot.status))}</span>
          <h2>${escapeHtml(snapshot.plan.name)}</h2>
          <p>${escapeHtml(billingHealthText(snapshot))}</p>
        </div>
        <div class="billing-days"><strong>${escapeHtml(daysText)}</strong><span>ciclo actual</span></div>
      </div>
      <div class="billing-mini-grid">
        <div><span>Inicio</span><strong>${escapeHtml(displayDate(snapshot.currentPeriodStart, 'No definido'))}</strong></div>
        <div><span>Vence</span><strong>${escapeHtml(displayDate(snapshot.currentPeriodEnd, 'No definido'))}</strong></div>
        <div><span>Próximo pago</span><strong>${escapeHtml(displayDate(snapshot.nextBillingDate, 'Pendiente'))}</strong></div>
        <div><span>Proveedor</span><strong>${escapeHtml(snapshot.paymentProvider || 'manual')}</strong></div>
      </div>
    </section>
  `;
}

function renderBillingAdminForm() {
  if (!can('billing_manage')) return '';
  const snapshot = getBillingSnapshot();
  const isSuper = can('users_manage');
  const disabled = isSuper ? '' : 'disabled';
  return `
    <section class="card" style="margin-top:18px;">
      <h2>Control manual de suscripción</h2>
      <p class="help">Uso interno mientras se activa Lemon Squeezy o Paddle. Solo el Superusuario debe modificar plan, estado y fechas.</p>
      <form data-form="billing-manual" class="form-grid two">
        <div class="field"><label>Plan comercial</label>
          <select name="plan_id" ${disabled}>
            ${Object.entries(PLAN_CATALOG).map(([key, plan]) => `<option value="${key}" ${snapshot.planKey === key ? 'selected' : ''}>${escapeHtml(plan.name)}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Estado</label>
          <select name="subscription_status" ${disabled}>
            ${['trial','active','past_due','suspended','cancelled'].map(value => `<option value="${value}" ${snapshot.status === value ? 'selected' : ''}>${escapeHtml(subscriptionStatusLabel(value))}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Inicio del periodo</label><input name="current_period_start" type="date" value="${escapeHtml(safeDateOnly(snapshot.currentPeriodStart))}" ${disabled} /></div>
        <div class="field"><label>Fin del periodo</label><input name="current_period_end" type="date" value="${escapeHtml(safeDateOnly(snapshot.currentPeriodEnd))}" ${disabled} /></div>
        <div class="field"><label>Próxima facturación</label><input name="next_billing_date" type="date" value="${escapeHtml(safeDateOnly(snapshot.nextBillingDate))}" ${disabled} /></div>
        <div class="field"><label>Método de pago manual</label><input name="manual_payment_method" value="${escapeHtml(snapshot.manualPaymentMethod)}" placeholder="Transferencia, efectivo, tarjeta, cheque" ${disabled} /></div>
        <div class="field"><label>Proveedor futuro</label>
          <select name="payment_provider" ${disabled}>
            ${['manual','lemon_squeezy','paddle','otro'].map(value => `<option value="${value}" ${String(snapshot.paymentProvider) === value ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Estado último pago</label>
          <select name="last_payment_status" ${disabled}>
            ${['','pending','paid','failed','refunded','manual_confirmed'].map(value => `<option value="${value}" ${String(snapshot.lastPaymentStatus || '') === value ? 'selected' : ''}>${escapeHtml(value || 'Sin registrar')}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Setup</label>
          <select name="setup_status" ${disabled}>
            ${['not_required','pending','in_progress','completed'].map(value => `<option value="${value}" ${String(snapshot.setupStatus) === value ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Monto setup</label><input name="setup_fee_amount" type="number" min="0" step="0.01" value="${escapeHtml(snapshot.setupFeeAmount)}" ${disabled} /></div>
        <div class="field" style="grid-column:1/-1;"><label>Notas internas</label><textarea name="internal_notes" ${disabled}>${escapeHtml(snapshot.internalNotes)}</textarea></div>
        ${isSuper ? `<button class="btn primary" type="submit">Guardar estado de plan</button>` : `<p class="help" style="grid-column:1/-1;">Tu rol puede ver planes y pagos, pero solo el Superusuario modifica la suscripción.</p>`}
      </form>
    </section>
  `;
}

function renderSubscriptionRulesCard() {
  return `
    <section class="card" style="margin-top:18px;">
      <h2>Reglas de acceso por estado</h2>
      <div class="status-rules-grid">
        <div><strong>Trial</strong><span>Prueba limitada. No debe usarse como operación completa.</span></div>
        <div><strong>Active</strong><span>Acceso normal según plan contratado.</span></div>
        <div><strong>Past due</strong><span>Aviso de pago pendiente. Se permite operar temporalmente.</span></div>
        <div><strong>Suspended</strong><span>Modo solo lectura; permite planes, pagos y consulta.</span></div>
        <div><strong>Cancelled</strong><span>Modo solo lectura; bloquea nuevas operaciones.</span></div>
      </div>
    </section>
  `;
}

function getRoute() {
  const raw = window.location.hash.replace('#', '');
  if (raw.includes('access_token=') || raw.includes('refresh_token=') || raw.includes('type=recovery')) return 'auth';
  return raw || (state.session ? 'dashboard' : 'home');
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

function normalizeQuoteItem(item = {}, index = 0) {
  const quantity = Number(item.quantity || 0);
  const unit_price = Number(item.unit_price || item.price || 0);
  return {
    id: item.id || uid('quote_item'),
    description: String(item.description || item.name || '').trim(),
    quantity,
    unit_price,
    total: Number(item.total ?? (quantity * unit_price)),
    position: Number(item.position ?? index)
  };
}

function normalizeQuote(quote = {}) {
  const rawItems = Array.isArray(quote.items) ? quote.items : (Array.isArray(quote.quote_items) ? quote.quote_items : []);
  const items = rawItems.map(normalizeQuoteItem).sort((a, b) => Number(a.position || 0) - Number(b.position || 0));
  const normalized = {
    ...quote,
    id: quote.id || uid('quote'),
    company_id: quote.company_id || state.company?.id || 'local-company',
    client_id: quote.client_id || '',
    quote_number: String(quote.quote_number || '').trim(),
    status: String(quote.status || 'draft'),
    created_at: quote.created_at || new Date().toISOString(),
    updated_at: quote.updated_at || quote.created_at || new Date().toISOString(),
    valid_until: quote.valid_until || '',
    tax_rate: Number(quote.tax_rate ?? state.company?.tax_rate ?? 0),
    notes: String(quote.notes || '').trim(),
    items
  };
  normalized.totals = quoteTotals(normalized);
  normalized.commercialStatus = quote.commercialStatus || getQuoteCommercialStatus(normalized);
  normalized.client = quote.client || getClient(normalized.client_id);
  normalized.needsFollowup = typeof quote.needsFollowup === 'boolean' ? quote.needsFollowup : quoteNeedsFollowup(normalized);
  return normalized;
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
  if (!state.session || state.passwordRecovery?.active) renderPublic(state.passwordRecovery?.active ? 'auth' : route);
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
          <div class="grid cols-4">
            <div class="plan-card card"><div class="plan-topline">CRM Básico</div><div class="plan-price">RD$2,900<span>/mes</span></div><p>Clientes, cotizaciones, seguimiento, catálogo y facturas comerciales simples.</p><button class="btn primary" data-route="auth">Comenzar</button></div>
            <div class="plan-card card"><div class="plan-topline">CRM Pro</div><div class="plan-price">RD$6,900<span>/mes</span></div><p>Facturas comerciales, pagos parciales, cuentas por cobrar, roles y reportes.</p><button class="btn primary" data-route="auth">Comenzar</button></div>
            <div class="plan-card card"><div class="plan-topline">Ganadero Pro</div><div class="plan-price">RD$12,900<span>/mes</span></div><p>CRM Pro más control diario de leche, productores, comisión, PDF y CSV mensual.</p><button class="btn primary" data-route="auth">Comenzar</button></div>
            <div class="plan-card card"><div class="plan-topline">CRM Empresa</div><div class="plan-price">Personalizado</div><p>Para varias sucursales, reportes personalizados o integraciones específicas.</p><a class="btn secondary" href="mailto:${escapeHtml(config.salesEmail || 'ventas@cotizaflow.app')}">Contactar</a></div>
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
        <div class="auth-modal-backdrop">
          <section class="login-box auth-modal">
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
  const tab = state.passwordRecovery?.active ? 'reset' : state.activeAuthTab;
  const title = tab === 'forgot' ? 'Recuperar acceso' : tab === 'reset' ? 'Crear nueva contraseña' : 'Acceso';
  return `
    <div class="auth-tabs">
      <button class="auth-tab ${tab === 'login' ? 'active' : ''}" type="button" data-auth-tab="login">Entrar</button>
      <button class="auth-tab ${tab === 'register' ? 'active' : ''}" type="button" data-auth-tab="register">Crear cuenta</button>
      <button class="auth-tab ${tab === 'forgot' ? 'active' : ''}" type="button" data-auth-tab="forgot">Olvidé contraseña</button>
    </div>
    ${state.authMessage ? `<div class="notice">${escapeHtml(state.authMessage)}</div>` : ''}
    ${disabled ? `
      <div class="notice warning">
        Supabase no está configurado. Puedes usar el demo local o editar <strong>config.js</strong> con tus credenciales públicas.
      </div>
    ` : ''}
    ${tab === 'forgot' ? renderForgotPasswordBox(disabled) : tab === 'reset' ? renderSetNewPasswordBox(disabled) : `
      <form data-form="auth" class="form-grid">
        ${tab === 'register' ? `
          <div class="field">
            <label>Nombre</label>
            <input name="name" placeholder="Tu nombre" ${disabled ? 'disabled' : ''} />
          </div>
        ` : ''}
        <div class="field">
          <label>Correo</label>
          <input name="email" type="email" required placeholder="tuempresa@email.com" autocomplete="email" ${disabled ? 'disabled' : ''} />
        </div>
        <div class="field">
          <label>Contraseña</label>
          <input name="password" type="password" required minlength="6" placeholder="Mínimo 6 caracteres" autocomplete="${tab === 'register' ? 'new-password' : 'current-password'}" ${disabled ? 'disabled' : ''} />
          ${tab === 'login' ? '<button class="link-button field-link" type="button" data-auth-tab="forgot">Olvidé mi contraseña</button>' : ''}
        </div>
        <button class="btn primary full" type="submit" ${disabled ? 'disabled' : ''}>
          ${tab === 'register' ? 'Crear cuenta' : 'Entrar'}
        </button>
        ${tab === 'register' ? '<p class="help full-span">Si el Superusuario ya te agregó en Usuarios y roles, crea tu cuenta con ese mismo correo. Al entrar, la app te vinculará automáticamente a la empresa y aplicará tu rol.</p>' : ''}
        <button class="btn secondary full" type="button" data-action="start-demo">Usar demo local</button>
      </form>
    `}
  `;
}

function renderForgotPasswordBox(disabled) {
  return `
    <div class="auth-helper">
      <h3>Recuperar contraseña</h3>
      <p>Escribe el correo del usuario. Se enviará un correo de recuperación. Si Supabase está configurado con código OTP, también podrás pegar el código temporal aquí y definir una contraseña nueva.</p>
    </div>
    <form data-form="forgot-password" class="form-grid">
      <div class="field full-span">
        <label>Correo del usuario</label>
        <input name="email" type="email" required placeholder="usuario@empresa.com" autocomplete="email" ${disabled ? 'disabled' : ''} />
      </div>
      <button class="btn primary full" type="submit" ${disabled ? 'disabled' : ''}>Enviar correo de recuperación</button>
    </form>
    <div class="auth-separator"><span>Si recibiste un código temporal</span></div>
    <form data-form="password-reset-code" class="form-grid">
      <div class="field">
        <label>Correo</label>
        <input name="email" type="email" required placeholder="usuario@empresa.com" autocomplete="email" ${disabled ? 'disabled' : ''} />
      </div>
      <div class="field">
        <label>Código / contraseña temporal</label>
        <input name="token" required placeholder="Código recibido por correo" autocomplete="one-time-code" ${disabled ? 'disabled' : ''} />
      </div>
      <div class="field">
        <label>Nueva contraseña</label>
        <input name="new_password" type="password" required minlength="8" placeholder="Mínimo 8 caracteres" autocomplete="new-password" ${disabled ? 'disabled' : ''} />
      </div>
      <div class="field">
        <label>Confirmar contraseña</label>
        <input name="confirm_password" type="password" required minlength="8" placeholder="Repite la contraseña" autocomplete="new-password" ${disabled ? 'disabled' : ''} />
      </div>
      <button class="btn primary full" type="submit" ${disabled ? 'disabled' : ''}>Validar y cambiar contraseña</button>
      <p class="help full-span">Si el correo trae un enlace, ábrelo desde este mismo navegador. La app mostrará automáticamente la casilla para crear la nueva contraseña.</p>
    </form>
  `;
}

function renderSetNewPasswordBox(disabled) {
  return `
    <div class="auth-helper">
      <h3>Nueva contraseña</h3>
      <p>Correo validado: <strong>${escapeHtml(state.passwordRecovery?.email || state.session?.email || '')}</strong>. Define la contraseña que usará este usuario para entrar.</p>
    </div>
    <form data-form="password-update" class="form-grid">
      <div class="field">
        <label>Nueva contraseña</label>
        <input name="new_password" type="password" required minlength="8" placeholder="Mínimo 8 caracteres" autocomplete="new-password" ${disabled ? 'disabled' : ''} />
      </div>
      <div class="field">
        <label>Confirmar contraseña</label>
        <input name="confirm_password" type="password" required minlength="8" placeholder="Repite la contraseña" autocomplete="new-password" ${disabled ? 'disabled' : ''} />
      </div>
      <button class="btn primary full" type="submit" ${disabled ? 'disabled' : ''}>Guardar contraseña y entrar</button>
    </form>
  `;
}

function renderApp(route) {
  app.innerHTML = `
    <div class="layout app-page">
      <aside class="sidebar">
        <div class="brand"><span class="brand-mark">C</span> CotizaFlow</div>
        <nav>
          ${canAccessPage('dashboard') ? navLink('dashboard', t('dashboard')) : ''}
          ${can('reports_read') && canAccessPage('reports') ? navLink('reports', t('followup')) : ''}
          ${can('reports_read') && canAccessPage('commercial_reports') ? navLink(canUseFeature('accounts_receivable') ? 'commercial-reports' : 'commercial-reports', 'Reportes' + (canUseFeature('accounts_receivable') ? '' : ' 🔒')) : ''}
          ${renderMilkNavLink()}
          ${renderMilkSettlementNavLink()}
          ${can('quotes_read') && canAccessPage('quotes') ? navLink('quotes', t('quotes')) : ''}
          ${can('invoices_read') && canAccessPage('invoices') ? navLink(canUseFeature('invoices') ? 'invoices' : 'invoices-upgrade', t('invoices') + (canUseFeature('invoices') ? '' : ' 🔒')) : ''}
          ${can('clients_read') && canAccessPage('clients') ? navLink('clients', t('clients')) : ''}
          ${can('catalog_read') && canAccessPage('catalog') ? navLink('catalog', t('catalog')) : ''}
          ${can('templates_read') && canAccessPage('templates') ? navLink('templates', t('templates')) : ''}
          ${can('settings_company') || can('billing_manage') || can('affiliates_manage') || can('integrations_manage') || can('users_manage') ? navLink(firstSettingsRoute(), t('settings')) : ''}
        </nav>
        <div class="sidebar-footer">
          <strong>${escapeHtml(state.company?.name || 'Mi empresa')}</strong><br />
          ${mode === 'supabase' ? 'Modo Supabase' : 'Modo demo local'}<br />
          Plan: ${escapeHtml(planStatusText())}<br />
          <button class="btn secondary small" data-action="logout" style="margin-top:12px;">Salir</button>
        </div>
      </aside>
      <main class="main">${renderUtilityBar()}${safeRenderRoute(route)}</main>
    </div>
  `;
}

function navLink(route, label) {
  return `<button class="nav-link ${getRoute() === route ? 'active' : ''}" data-route="${route}">${label}</button>`;
}

function renderMilkNavLink() {
  if (!isDairyBusiness()) return '';
  if (!can('milk_read') || !canAccessPage('milk')) return '';
  if (canOperateGanadero()) return navLink('milk', t('milkControl'));
  return navLink('ganadero-upgrade', `${t('milkControl')} 🔒`);
}

function renderMilkSettlementNavLink() {
  if (!isDairyBusiness()) return '';
  if (!can('milk_read') || !canAccessPage('milk_settlements')) return '';
  if (canOperateGanadero() && canUseFeature('ganadero_monthly_summary')) return navLink('milk-settlements', 'Liquidaciones');
  return navLink('ganadero-upgrade', 'Liquidaciones 🔒');
}

function safeRenderRoute(route) {
  try {
    return renderRoute(route);
  } catch (error) {
    console.error('Error renderizando ruta', route, error);
    return `
      <section class="card access-denied">
        <h1>No se pudo abrir esta pantalla</h1>
        <p>Se detectó un error de interfaz en <strong>${escapeHtml(route || 'dashboard')}</strong>. La sesión sigue activa.</p>
        <p class="help">Detalle técnico: ${escapeHtml(error.message || String(error))}</p>
        <button class="btn secondary" data-route="dashboard">Volver al Dashboard</button>
        <button class="btn primary" data-route="billing">Revisar plan</button>
      </section>
    `;
  }
}

function renderRoute(route) {
  if (route === 'ganadero-upgrade') return renderGanaderoUpgrade();
  if (route === 'invoices-upgrade') return renderFeatureLocked('invoices', 'Facturas comerciales no incluidas', 'Actualiza tu plan para crear facturas comerciales, controlar pagos y consultar cuentas por cobrar.');
  if (route.startsWith('quote-edit/')) return can('quotes_write') ? renderQuoteForm(route.split('/')[1]) : renderAccessDenied();
  if (route.startsWith('quote-view/')) return can('quotes_read') ? renderQuoteView(route.split('/')[1]) : renderAccessDenied();
  if (route.startsWith('invoice-view/')) {
    if (!canUseFeature('invoices')) return renderFeatureLocked('invoices', 'Facturas comerciales no incluidas');
    return can('invoices_read') ? renderInvoiceView(route.split('/')[1]) : renderAccessDenied();
  }

  const pageKey = routeToPageKey(route);
  if (!canAccessPage(pageKey)) return renderAccessDenied('Esta pantalla fue desactivada para tu usuario.');

  const routePermissions = {
    quotes: 'quotes_read',
    'quote-new': 'quotes_write',
    reports: 'reports_read',
    'commercial-reports': 'reports_read',
    'milk-settlements': 'milk_read',
    'plan-qa': 'users_manage',
    diagnostics: 'users_manage',
    invoices: 'invoices_read',
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
  if (route === 'milk' && !canOperateGanadero()) return renderGanaderoUpgrade();
  if (route === 'milk-settlements' && (!canOperateGanadero() || !canUseFeature('ganadero_monthly_summary'))) return renderGanaderoUpgrade();
  if (route === 'invoices' && !canUseFeature('invoices')) return renderFeatureLocked('invoices', 'Facturas comerciales no incluidas');
  if (route === 'quote-new' && !evaluateActionGate('quote_create').ok) return renderActionLocked('quote_create', {}, 'No puedes crear otra cotización');
  if (route === 'catalog' && !canUseFeature('catalog')) return renderFeatureLocked('catalog', 'Catálogo no incluido');
  if (route === 'clients' && !canUseFeature('clients')) return renderFeatureLocked('clients', 'Clientes no incluido');
  if (route === 'reports' && !canUseFeature('follow_up')) return renderFeatureLocked('follow_up', 'Seguimiento no incluido');
  if (route === 'commercial-reports' && !canUseFeature('accounts_receivable')) return renderFeatureLocked('accounts_receivable', 'Reportes comerciales disponibles en CRM Pro', 'Actualiza a CRM Pro para ver ventas, facturas, cobros, cuentas por cobrar y exportaciones operativas.');
  if (route === 'templates' && !canUseFeature('whatsapp_templates')) return renderFeatureLocked('whatsapp_templates', 'Plantillas de WhatsApp no incluidas');
  if (route === 'affiliates' && !canUseFeature('referrals')) return renderFeatureLocked('referrals', 'Referidos no incluidos');
  if (route === 'integrations' && !canUseFeature('integrations')) return renderFeatureLocked('integrations', 'Integraciones no incluidas');

  switch (route) {
    case 'quotes': return renderQuotes();
    case 'quote-new': return renderQuoteForm();
    case 'reports': return renderReports();
    case 'commercial-reports': return renderCommercialReports();
    case 'plan-qa': return renderPlanQaCenter();
    case 'diagnostics': return renderDiagnostics();
    case 'invoices': return renderInvoices();
    case 'clients': return renderClients();
    case 'catalog': return renderCatalog();
    case 'templates': return renderTemplates();
    case 'milk': return renderMilkControl();
    case 'milk-settlements': return renderMilkSettlements();
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
    pendingQuotes: getCommercialAnalytics().needsFollowup.length,
    invoiceStats: getInvoiceAnalytics()
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

    <section class="grid cols-4 dairy-metrics" style="margin-top:18px;">
      <div class="card metric"><span>Ventas facturadas</span><strong>${money(stats.invoiceStats.totalIssued)}</strong></div>
      <div class="card metric"><span>Cuentas por cobrar</span><strong>${money(stats.invoiceStats.totalReceivable)}</strong></div>
      <div class="card metric"><span>Cobrado</span><strong>${money(stats.invoiceStats.totalPaid)}</strong></div>
      <div class="card metric"><span>Facturas vencidas</span><strong>${stats.invoiceStats.overdue.length}</strong></div>
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
  if (isDairyBusiness()) return canOperateGanadero() ? renderDairyDashboard() : renderGanaderoUpgrade();
  const analytics = getCommercialAnalytics();
  const latest = [...analytics.quotes].sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || ''))).slice(0, 6);
  const topClients = getTopClients(analytics.quotes).slice(0, 5);
  const topServices = getTopServices(analytics.quotes).slice(0, 5);
  const invoiceStats = getInvoiceAnalytics();

  return `
    <div class="page-header">
      <div>
        <h1>Dashboard comercial</h1>
        <p>Seguimiento de oportunidades, vencimientos, tasa de cierre y montos por estado.</p>
      </div>
      <div class="header-actions">
        <button class="btn secondary" data-route="reports">Ver seguimiento</button>
        ${canUseFeature('accounts_receivable') ? '<button class="btn primary" data-route="commercial-reports">Reportes comerciales</button>' : '<button class="btn secondary" data-route="billing">Reportes en CRM Pro</button>'}
      </div>
    </div>

    ${renderPlanCommercialNudges()}

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

    <section class="grid cols-4" style="margin-top:18px;">
      <div class="card metric"><span>Facturas emitidas</span><strong>${invoiceStats.issuedCount}</strong></div>
      <div class="card metric"><span>Cuentas por cobrar</span><strong>${money(invoiceStats.totalReceivable)}</strong></div>
      <div class="card metric"><span>Cobrado</span><strong>${money(invoiceStats.totalPaid)}</strong></div>
      <div class="card metric"><span>Facturas vencidas</span><strong>${invoiceStats.overdue.length}</strong></div>
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


function renderCommercialReports() {
  const analytics = getCommercialAnalytics();
  const invoiceStats = getInvoiceAnalytics();
  const issued = invoiceStats.issued || [];
  const monthly = getMonthlyCommercialSummary();
  const topReceivables = getTopReceivables().slice(0, 8);
  const conversionRate = analytics.quotes.length ? Math.round((analytics.accepted.length / analytics.quotes.length) * 100) : 0;
  const canExport = canExportCommercialReports();
  return `
    <div class="page-header">
      <div>
        <h1>Reportes comerciales</h1>
        <p>Resumen simple de ventas, facturas comerciales internas, cobros y cuentas por cobrar.</p>
      </div>
      <div class="header-actions">
        <button class="btn secondary" data-route="dashboard">Dashboard</button>
        ${canExport ? '<button class="btn primary" data-action="export-commercial-report-csv">Exportar CSV</button>' : '<button class="btn secondary" data-route="billing">CSV en CRM Pro</button>'}
      </div>
    </div>

    <section class="grid cols-4">
      <div class="card metric"><span>Cotizado</span><strong>${money(analytics.quotes.reduce((sum, q) => sum + q.totals.total, 0))}</strong></div>
      <div class="card metric"><span>Conversión</span><strong>${conversionRate}%</strong></div>
      <div class="card metric"><span>Facturado</span><strong>${money(invoiceStats.totalIssued)}</strong></div>
      <div class="card metric"><span>Por cobrar</span><strong>${money(invoiceStats.totalReceivable)}</strong></div>
    </section>

    <section class="grid cols-4" style="margin-top:18px;">
      <div class="card metric"><span>Cobrado</span><strong>${money(invoiceStats.totalPaid)}</strong></div>
      <div class="card metric"><span>Facturas emitidas</span><strong>${invoiceStats.issuedCount}</strong></div>
      <div class="card metric"><span>Vencidas</span><strong>${invoiceStats.overdue.length}</strong></div>
      <div class="card metric"><span>Borradores</span><strong>${invoiceStats.draftCount}</strong></div>
    </section>

    <section class="grid cols-2" style="margin-top:18px; align-items:start;">
      <div class="card">
        <h2>Resumen mensual</h2>
        ${monthly.length ? renderMonthlyCommercialSummary(monthly) : '<div class="empty">Todavía no hay datos comerciales para resumir.</div>'}
      </div>
      <div class="card">
        <h2>Mayores saldos por cobrar</h2>
        ${topReceivables.length ? renderReceivablesTable(topReceivables) : '<div class="empty">No hay saldos pendientes.</div>'}
      </div>
    </section>

    <section class="card" style="margin-top:18px;">
      <h2>Lectura operativa</h2>
      <div class="bullets">
        <span>Si el monto cotizado es alto pero la conversión baja, prioriza seguimiento y ajuste de plantillas.</span>
        <span>Si cuentas por cobrar sube, conviene registrar pagos parciales y enviar recordatorios.</span>
        <span>Las facturas son comerciales internas; NCF/e-CF fiscal queda para una fase posterior con backend seguro.</span>
      </div>
    </section>
  `;
}

function getMonthlyCommercialSummary() {
  const rows = new Map();
  const keyOf = (dateValue) => {
    const d = safeDate(dateValue) || new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };
  (state.quotes || []).forEach(q => {
    const nq = normalizeQuote(q);
    const key = keyOf(nq.created_at);
    const row = rows.get(key) || { month: key, quoted: 0, accepted: 0, invoiced: 0, paid: 0, receivable: 0, quotes: 0, invoices: 0 };
    row.quoted += nq.totals.total;
    row.quotes += 1;
    if (nq.status === 'accepted') row.accepted += nq.totals.total;
    rows.set(key, row);
  });
  (state.invoices || []).forEach(inv => {
    const ni = normalizeInvoice(inv);
    const status = effectiveInvoiceStatus(ni);
    const key = keyOf(ni.issue_date || ni.created_at);
    const row = rows.get(key) || { month: key, quoted: 0, accepted: 0, invoiced: 0, paid: 0, receivable: 0, quotes: 0, invoices: 0 };
    if (status !== 'draft' && status !== 'void') {
      row.invoiced += invoiceTotals(ni).total;
      row.paid += invoicePaidAmount(ni);
      row.receivable += invoiceBalance(ni);
      row.invoices += 1;
    }
    rows.set(key, row);
  });
  return [...rows.values()].sort((a,b) => b.month.localeCompare(a.month)).slice(0, 12);
}

function renderMonthlyCommercialSummary(rows) {
  return `
    <div class="table-wrap compact-table">
      <table>
        <thead><tr><th>Mes</th><th>Cotizado</th><th>Facturado</th><th>Cobrado</th><th>Por cobrar</th></tr></thead>
        <tbody>${rows.map(row => `<tr><td><strong>${escapeHtml(row.month)}</strong></td><td>${money(row.quoted)}</td><td>${money(row.invoiced)}</td><td>${money(row.paid)}</td><td>${money(row.receivable)}</td></tr>`).join('')}</tbody>
      </table>
    </div>
  `;
}

function getTopReceivables() {
  return (state.invoices || [])
    .map(inv => normalizeInvoice(inv))
    .filter(inv => !['draft','void','paid'].includes(effectiveInvoiceStatus(inv)) && invoiceBalance(inv) > 0)
    .map(inv => ({ invoice: inv, client: getClient(inv.client_id), balance: invoiceBalance(inv), total: invoiceTotals(inv).total, due_date: inv.due_date }))
    .sort((a,b) => b.balance - a.balance);
}

function renderReceivablesTable(rows) {
  return `
    <div class="table-wrap compact-table">
      <table>
        <thead><tr><th>Cliente</th><th>Factura</th><th>Vence</th><th>Saldo</th></tr></thead>
        <tbody>${rows.map(row => `<tr><td>${escapeHtml(row.client?.name || 'Sin cliente')}</td><td><button class="link-button" data-route="invoice-view/${row.invoice.id}">${escapeHtml(row.invoice.invoice_number)}</button></td><td>${formatDate(row.due_date)}</td><td><strong>${money(row.balance)}</strong></td></tr>`).join('')}</tbody>
      </table>
    </div>
  `;
}

function canExportCommercialReports() {
  if (!canUseFeature('exports_csv')) return false;
  if (!hasWritableSubscription()) return false;
  const usage = getPlanUsage();
  const exportsResource = usage.resources?.exports;
  return !exportsResource || exportsResource.limit == null || Number(exportsResource.used || 0) < Number(exportsResource.limit || 0);
}

async function exportCommercialReportCsv() {
  if (!canExportCommercialReports()) {
    toast('Exportación CSV disponible en CRM Pro con cuenta activa y límite disponible.');
    setRoute('billing');
    render();
    return;
  }
  const rows = getMonthlyCommercialSummary();
  const csvRows = [['mes','cotizado','aceptado','facturado','cobrado','por_cobrar','cotizaciones','facturas']];
  rows.forEach(row => csvRows.push([row.month, row.quoted, row.accepted, row.invoiced, row.paid, row.receivable, row.quotes, row.invoices]));
  downloadTextFile(`reporte-comercial-${new Date().toISOString().slice(0,10)}.csv`, csvRows.map(r => r.map(csvEscape).join(',')).join('\n'), 'text/csv;charset=utf-8');
  recordExportUsage('commercial_report_csv');
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function downloadTextFile(filename, content, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function renderPlanQaAccessCard() {
  return `
    <section class="card" style="margin-top:18px;">
      <div class="page-header" style="margin-bottom:0;">
        <div>
          <h2>QA por planes</h2>
          <p>Centro de validación para confirmar límites, módulos y estados antes de vender.</p>
        </div>
        <button class="btn secondary" data-route="plan-qa">Abrir QA</button>
      </div>
    </section>
  `;
}

function renderPlanQaCenter() {
  const current = getPlanUsage();
  return `
    <div class="page-header">
      <div>
        <h1>QA por planes</h1>
        <p>Validación manual rápida para Demo, CRM Básico, CRM Pro, Ganadero Pro y CRM Empresa.</p>
      </div>
      <div class="header-actions"><button class="btn secondary" data-route="billing">Planes y pagos</button></div>
    </div>
    <section class="card">
      <h2>Empresa actual</h2>
      <div class="billing-mini-grid">
        <div><span>Plan efectivo</span><strong>${escapeHtml(current.plan.name)}</strong></div>
        <div><span>Estado</span><strong>${escapeHtml(subscriptionStatusLabel(getBillingSnapshot().status))}</strong></div>
        <div><span>Tipo negocio</span><strong>${escapeHtml(businessTypeLabel(state.company?.business_type))}</strong></div>
        <div><span>Rol actual</span><strong>${escapeHtml(currentRoleLabel())}</strong></div>
      </div>
    </section>
    <section class="grid cols-2" style="margin-top:18px; align-items:start;">
      ${Object.keys(PLAN_CATALOG).map(key => renderPlanQaCard(key)).join('')}
    </section>
  `;
}

function currentRoleLabel() {
  const role = normalizeRole(state.currentMember?.role || state.session?.role || 'superuser');
  return ROLE_DEFINITIONS[role]?.label || role;
}

function renderPlanQaCard(planKey) {
  const plan = PLAN_CATALOG[planKey];
  const features = ['clients','quotes','invoices','partial_payments','accounts_receivable','exports_csv','ganadero_module','roles_advanced','multi_company'];
  const included = new Set(plan.features || []);
  return `
    <div class="card qa-plan-card">
      <h2>${escapeHtml(plan.name)}</h2>
      <p>${escapeHtml(plan.description || '')}</p>
      <div class="billing-mini-grid">
        <div><span>Usuarios</span><strong>${plan.users}</strong></div>
        <div><span>Clientes</span><strong>${formatLimit(plan.maxClients)}</strong></div>
        <div><span>Cotizaciones</span><strong>${formatLimit(plan.maxQuotesPerMonth)}</strong></div>
        <div><span>Facturas</span><strong>${formatLimit(plan.maxInvoicesPerMonth)}</strong></div>
      </div>
      <div class="feature-checklist">
        ${features.map(feature => `<span class="badge ${included.has(feature) ? 'success' : 'muted'}">${included.has(feature) ? '✓' : '×'} ${escapeHtml(FEATURE_DEFINITIONS[feature]?.label || feature)}</span>`).join('')}
      </div>
      <div class="qa-steps">
        ${renderPlanQaSteps(planKey)}
      </div>
    </div>
  `;
}

function renderPlanQaSteps(planKey) {
  const steps = {
    demo: ['Crear 5 clientes: debe permitirlos.', 'Intentar crear cliente 6: debe bloquear.', 'Intentar CSV: debe mostrar upgrade.', 'PDF debe incluir marca DEMO.'],
    crm_basico: ['Crear clientes y cotizaciones dentro del límite.', 'Facturas simples disponibles.', 'Pagos parciales y cuentas por cobrar avanzadas deben pedir CRM Pro.', 'Ganadero debe pedir Ganadero Pro.'],
    crm_pro: ['Facturas comerciales y pagos parciales disponibles.', 'Cuentas por cobrar disponible.', 'CSV comercial disponible.', 'Control Diario ganadero debe estar bloqueado.'],
    ganadero_pro: ['Con tipo Asociación Ganaderos debe abrir Control Diario.', 'PDF y CSV ganadero disponibles.', 'Dashboard ganadero visible.', 'Facturación de insumos y servicios disponible.'],
    crm_empresa: ['Debe incluir módulos avanzados.', 'Multiempresa e integraciones quedan visibles como premium empresarial.', 'Límites amplios.', 'Reportes personalizados preparados.']
  }[planKey] || [];
  return `<ol>${steps.map(step => `<li>${escapeHtml(step)}</li>`).join('')}</ol>`;
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


function formatLimit(value) {
  return Number.isFinite(value) ? numberFmt(value, 0) : 'Ilimitado';
}

function renderDemoLimitCard() {
  if (!isDemoPlan()) return '';
  return `
    <section class="card demo-limit-card" style="margin-top:18px;">
      <div class="page-header" style="margin-bottom:12px;">
        <div>
          <span class="badge locked">Demo no productivo</span>
          <h2>Prueba controlada</h2>
          <p>${escapeHtml(demoRestrictionNotice())}</p>
        </div>
        <button class="btn primary" data-route="billing">Actualizar plan</button>
      </div>
      <div class="bullets">
        <span>Los PDFs salen con marca de agua DEMO.</span>
        <span>Las exportaciones CSV quedan bloqueadas.</span>
        <span>Control Diario ganadero requiere Ganadero Pro.</span>
        <span>Para operar una empresa real, usa CRM Básico, CRM Pro o Ganadero Pro.</span>
      </div>
    </section>
  `;
}

function renderUsageCard() {
  const usage = getPlanUsage();
  const status = normalizeSubscriptionStatus(getRawBillingStatus());
  const resources = ['clients','quotes','invoices','catalog','users','exports'].map(key => ({ key, ...usage.resources[key] }));
  return `
    <section class="card usage-card" style="margin-top:18px;">
      <div class="page-header" style="margin-bottom:12px;">
        <div>
          <h2>Uso y límites del plan</h2>
          <p>${escapeHtml(usage.plan.name)} · Estado: ${escapeHtml(status)} · ${escapeHtml(usage.plan.setupLabel || '')}</p>
        </div>
        <button class="btn secondary" data-route="billing">Ver planes</button>
      </div>
      <div class="usage-grid">
        ${resources.map(resource => `
          <div class="mini-usage">
            <strong>${escapeHtml(resource.label)}</strong>
            <span>${formatLimit(resource.used)} / ${formatLimit(resource.limit)}</span>
            ${Number.isFinite(resource.limit) && resource.limit > 0 ? `<div class="usage-bar small"><span style="width:${resource.percent}%"></span></div>` : '<p class="help">Sin límite práctico en este plan.</p>'}
          </div>
        `).join('')}
      </div>
      ${status === 'past_due' ? `<div class="notice warning" style="margin-top:14px;">Tu suscripción tiene pago pendiente. Puedes consultar datos, pero algunas funciones podrán bloquearse si pasa a suspendida.</div>` : ''}
      ${isSubscriptionBlocked() ? `<div class="notice danger" style="margin-top:14px;">La suscripción está ${escapeHtml(status)}. El sistema queda en modo consulta; actualiza el plan para crear nuevos registros.</div>` : ''}
    </section>
  `;
}


function importantFeatureKeysForBusiness() {
  const keys = ['invoices','partial_payments','accounts_receivable','exports_csv','roles_advanced'];
  if (state.company?.business_type === 'asociacion_ganaderos') keys.push('ganadero_module','ganadero_daily_control','ganadero_monthly_summary','ganadero_pdf','ganadero_csv');
  keys.push('integrations','custom_reports');
  return [...new Set(keys)];
}

function renderPlanCommercialNudges() {
  const planKey = getEffectivePlanKey();
  const status = normalizeSubscriptionStatus(getRawBillingStatus());
  const locked = importantFeatureKeysForBusiness().filter(key => !canUseFeature(key));
  const topLocked = locked.slice(0, 3);
  if (planKey === 'crm_empresa' && !isSubscriptionBlocked() && status !== 'past_due') return '';
  const title = isSubscriptionBlocked()
    ? 'Cuenta en modo consulta'
    : planKey === 'demo'
      ? 'Demo limitado para pruebas'
      : topLocked.length
        ? 'Funciones disponibles al actualizar'
        : 'Plan activo';
  const detail = isSubscriptionBlocked()
    ? 'Puedes entrar, revisar información y acceder a Planes y pagos, pero no crear nuevos registros hasta reactivar la suscripción.'
    : planKey === 'demo'
      ? 'La demo no está diseñada para operar una empresa real. Actualiza para quitar límites y marca de agua.'
      : topLocked.length
        ? `Tu plan actual no incluye: ${topLocked.map(k => FEATURE_DEFINITIONS[k]?.label || k).join(', ')}.`
        : 'El plan actual está activo y cubre los módulos principales.';
  return `
    <section class="card commercial-nudge">
      <div>
        <span class="badge ${isSubscriptionBlocked() ? 'danger' : 'locked'}">${escapeHtml(getEffectivePlan().name)}</span>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(detail)}</p>
      </div>
      <div class="actions">
        <button class="btn primary" data-route="billing">Ver plan</button>
        ${topLocked[0] ? `<a class="btn secondary" href="${escapeHtml(salesContactUrl(planKeyByCommercialName(featureUpgradePlan(topLocked[0]))))}" target="_blank" rel="noopener">Consultar upgrade</a>` : ''}
      </div>
    </section>
  `;
}

function renderModuleAccessGrid() {
  const sections = [
    { key: 'clients', label: 'Clientes / CRM', plan: 'CRM Básico' },
    { key: 'quotes', label: 'Cotizaciones', plan: 'CRM Básico' },
    { key: 'invoices', label: 'Facturas comerciales', plan: 'CRM Básico' },
    { key: 'partial_payments', label: 'Pagos parciales', plan: 'CRM Pro' },
    { key: 'accounts_receivable', label: 'Cuentas por cobrar', plan: 'CRM Pro' },
    { key: 'roles_advanced', label: 'Roles avanzados', plan: 'CRM Pro' },
    { key: 'exports_csv', label: 'Exportaciones CSV', plan: 'CRM Pro' },
    { key: 'ganadero_module', label: 'Control Diario ganadero', plan: 'Ganadero Pro' },
    { key: 'custom_reports', label: 'Reportes personalizados', plan: 'CRM Empresa' },
    { key: 'integrations', label: 'Integraciones', plan: 'CRM Empresa' }
  ];
  return `
    <section class="card" style="margin-top:18px;">
      <div class="page-header" style="margin-bottom:12px;">
        <div><h2>Acceso por módulos</h2><p>Vista comercial de lo incluido, bloqueado y disponible por upgrade.</p></div>
      </div>
      <div class="module-access-grid">
        ${sections.map(item => {
          const allowed = canUseFeature(item.key);
          return `
            <div class="module-access-card ${allowed ? 'allowed' : 'locked'}">
              <span class="badge ${allowed ? 'ok' : 'locked'}">${allowed ? 'Incluido' : item.plan}</span>
              <strong>${escapeHtml(item.label)}</strong>
              <p>${escapeHtml(allowed ? 'Disponible en el plan actual.' : upgradeValueText(item.key))}</p>
            </div>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

function invoiceFallbackKey() {
  const userId = state.session?.id || 'local-user';
  const companyId = state.company?.id || 'local-company';
  return `${INVOICE_FALLBACK_STORAGE_KEY}:${userId}:${companyId}`;
}

function loadInvoicesLocalFallback() {
  try {
    const raw = localStorage.getItem(invoiceFallbackKey());
    return raw ? JSON.parse(raw).map(normalizeInvoice) : [];
  } catch (_error) {
    return [];
  }
}

function saveInvoicesLocalFallback() {
  try {
    localStorage.setItem(invoiceFallbackKey(), JSON.stringify((state.invoices || []).map(normalizeInvoice)));
  } catch (error) {
    console.warn('No se pudieron guardar facturas localmente:', error);
  }
}

async function loadInvoices() {
  state.invoiceStorageMode = 'local';
  state.invoices = mode === 'local' ? (state.invoices || []).map(normalizeInvoice) : loadInvoicesLocalFallback();
  if (mode !== 'supabase' || !supabaseClient || !state.company?.id) return;
  try {
    const { data, error } = await supabaseClient
      .from('invoices')
      .select('*, invoice_items(*), invoice_payments(*)')
      .eq('company_id', state.company.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    state.invoices = (data || []).map(row => normalizeInvoice({
      ...row,
      items: (row.invoice_items || []).sort((a, b) => Number(a.position || 0) - Number(b.position || 0)),
      payments: (row.invoice_payments || []).sort((a, b) => String(b.payment_date || '').localeCompare(String(a.payment_date || '')))
    }));
    state.invoiceStorageMode = 'supabase';
  } catch (error) {
    console.warn('Facturas en modo local/fallback. Ejecuta schema_phase9_invoices.sql para persistencia Supabase:', error.message || error);
  }
}

function getBusinessInvoiceProfile(businessType = state.company?.business_type || 'general') {
  const profiles = {
    asociacion_ganaderos: {
      title: 'Facturas de venta de insumos y servicios',
      subtitle: 'Para asociaciones ganaderas, este módulo factura ventas como alimento, medicamentos, transporte o servicios. La leche recibida se maneja en Control Diario y se liquidará aparte.',
      prefix: 'FG-',
      dueDays: 15,
      context: 'dairy_sales',
      warning: 'No uses Facturas para registrar leche recibida. Usa Control Diario para entregas y cierre mensual para liquidaciones.'
    },
    taller: { title: 'Facturas de servicio técnico', subtitle: 'Factura mano de obra, piezas, diagnósticos y servicios terminados.', prefix: 'FT-', dueDays: 7, context: 'service_sales' },
    camaras: { title: 'Facturas de instalación y equipos', subtitle: 'Factura instalación, equipos, materiales y mantenimiento.', prefix: 'FI-', dueDays: 7, context: 'service_sales' },
    electricos: { title: 'Facturas de servicios eléctricos', subtitle: 'Factura servicios, materiales, mantenimiento e instalaciones.', prefix: 'FE-', dueDays: 7, context: 'service_sales' },
    aires: { title: 'Facturas de climatización', subtitle: 'Factura instalación, mantenimiento, piezas y servicios.', prefix: 'FA-', dueDays: 7, context: 'service_sales' },
    imprenta: { title: 'Facturas de producción', subtitle: 'Factura trabajos impresos, diseños, materiales y entregas.', prefix: 'FP-', dueDays: 7, context: 'retail_sales' },
    carga: { title: 'Facturas de logística', subtitle: 'Factura fletes, entregas, manejo y servicios de carga.', prefix: 'FC-', dueDays: 15, context: 'service_sales' },
    suplidor: { title: 'Facturas de suplidor', subtitle: 'Factura productos, servicios y entregas a crédito o contado.', prefix: 'FS-', dueDays: 15, context: 'retail_sales' },
    general: { title: 'Facturas comerciales', subtitle: 'Convierte cotizaciones aceptadas en cuentas por cobrar simples.', prefix: 'F-', dueDays: 15, context: 'general_sales' }
  };
  return profiles[businessType] || profiles.general;
}

function invoiceStatusLabel(status) {
  return {
    draft: 'Borrador',
    issued: 'Emitida',
    partially_paid: 'Pagada parcial',
    paid: 'Pagada',
    overdue: 'Vencida',
    void: 'Anulada'
  }[String(status || 'draft')] || status;
}

function invoiceStatusBadge(status) {
  const css = { partially_paid: 'warning', paid: 'accepted', overdue: 'expired', issued: 'sent', void: 'rejected' }[String(status || 'draft')] || status || 'draft';
  return `<span class="badge ${escapeHtml(css)}">${escapeHtml(invoiceStatusLabel(status))}</span>`;
}

function normalizeInvoiceItem(item = {}, index = 0) {
  const quantity = Number(item.quantity || 0);
  const unit_price = Number(item.unit_price || 0);
  return {
    id: item.id || uid('inv_item'),
    description: String(item.description || '').trim(),
    quantity,
    unit_price,
    total: Number(item.total ?? (quantity * unit_price)),
    position: Number(item.position ?? index)
  };
}

function normalizeInvoicePayment(payment = {}) {
  return {
    id: payment.id || uid('pay'),
    invoice_id: payment.invoice_id || '',
    payment_date: String(payment.payment_date || todayISO()).slice(0, 10),
    amount: Number(payment.amount || 0),
    method: String(payment.method || 'transferencia').trim(),
    reference: String(payment.reference || '').trim(),
    notes: String(payment.notes || '').trim(),
    created_at: payment.created_at || new Date().toISOString()
  };
}

function normalizeInvoice(invoice = {}) {
  const items = (invoice.items || invoice.invoice_items || []).map(normalizeInvoiceItem);
  const payments = (invoice.payments || invoice.invoice_payments || []).map(normalizeInvoicePayment);
  return {
    id: invoice.id || uid('invoice'),
    company_id: invoice.company_id || state.company?.id || 'local-company',
    client_id: invoice.client_id || '',
    quote_id: invoice.quote_id || null,
    invoice_number: String(invoice.invoice_number || '').trim(),
    status: String(invoice.status || 'draft'),
    issue_date: String(invoice.issue_date || todayISO()).slice(0, 10),
    due_date: String(invoice.due_date || addDaysISO(Number(state.company?.default_invoice_due_days || getBusinessInvoiceProfile().dueDays))).slice(0, 10),
    currency: String(invoice.currency || state.company?.currency || 'USD').toUpperCase(),
    tax_rate: Number(invoice.tax_rate ?? state.company?.tax_rate ?? 0),
    discount_amount: Number(invoice.discount_amount || 0),
    notes: String(invoice.notes || '').trim(),
    terms: String(invoice.terms || '').trim(),
    document_type: String(invoice.document_type || 'commercial_invoice'),
    fiscal_number: String(invoice.fiscal_number || ''),
    fiscal_status: String(invoice.fiscal_status || 'not_applicable'),
    fiscal_receipt_type: String(invoice.fiscal_receipt_type || state.company?.default_fiscal_receipt_type || 'none'),
    fiscal_provider: String(invoice.fiscal_provider || state.company?.fiscal_provider || ''),
    fiscal_sync_status: String(invoice.fiscal_sync_status || 'not_enabled'),
    business_context: String(invoice.business_context || getBusinessInvoiceProfile().context),
    source_type: String(invoice.source_type || (invoice.quote_id ? 'quote' : 'manual')),
    items,
    payments,
    created_at: invoice.created_at || new Date().toISOString(),
    updated_at: invoice.updated_at || invoice.created_at || new Date().toISOString(),
    void_reason: invoice.void_reason || ''
  };
}

function invoiceTotals(invoice) {
  const subtotal = (invoice.items || []).reduce((sum, item) => sum + Number(item.total || 0), 0);
  const discount = Number(invoice.discount_amount || 0);
  const taxable = Math.max(0, subtotal - discount);
  const tax = taxable * (Number(invoice.tax_rate || 0) / 100);
  return { subtotal, discount, taxable, tax, total: taxable + tax };
}

function invoicePaidAmount(invoice) {
  return (invoice.payments || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
}

function invoiceBalance(invoice) {
  return Math.max(0, invoiceTotals(invoice).total - invoicePaidAmount(invoice));
}

function effectiveInvoiceStatus(invoice) {
  if (invoice.status === 'void') return 'void';
  const balance = invoiceBalance(invoice);
  if (balance <= 0 && invoicePaidAmount(invoice) > 0) return 'paid';
  if (invoicePaidAmount(invoice) > 0) return 'partially_paid';
  if (invoice.status !== 'draft' && invoice.due_date && daysBetween(invoice.due_date) < 0) return 'overdue';
  return invoice.status || 'draft';
}

function getInvoiceAnalytics() {
  const invoices = (state.invoices || []).map(inv => ({ ...normalizeInvoice(inv), effectiveStatus: effectiveInvoiceStatus(inv) }));
  const active = invoices.filter(inv => inv.effectiveStatus !== 'void');
  const issued = active.filter(inv => inv.effectiveStatus !== 'draft');
  const overdue = active.filter(inv => inv.effectiveStatus === 'overdue');
  const totalIssued = issued.reduce((sum, inv) => sum + invoiceTotals(inv).total, 0);
  const totalPaid = active.reduce((sum, inv) => sum + invoicePaidAmount(inv), 0);
  const totalReceivable = active.reduce((sum, inv) => sum + invoiceBalance(inv), 0);
  const draftCount = invoices.filter(inv => inv.effectiveStatus === 'draft').length;
  return { invoices, active, issued, overdue, totalIssued, totalPaid, totalReceivable, draftCount, issuedCount: issued.length };
}

function getClientInvoices(clientId) {
  return (state.invoices || []).filter(inv => String(inv.client_id || '') === String(clientId || '')).map(normalizeInvoice);
}

function quoteInvoice(quoteId) {
  return (state.invoices || []).find(inv => String(inv.quote_id || '') === String(quoteId || '') && inv.status !== 'void') || null;
}

function nextInvoiceNumber() {
  const profile = getBusinessInvoiceProfile();
  const prefix = String(state.company?.invoice_prefix || profile.prefix || 'F-').trim();
  const configuredNext = Math.max(1, Number(state.company?.next_invoice_number || 1));
  const numericFromExisting = (state.invoices || []).map(inv => {
    const number = String(inv.invoice_number || '');
    const match = number.match(/(\d+)$/);
    return match ? Number(match[1]) : 0;
  });
  const maxExisting = Math.max(...numericFromExisting, 0);
  const next = Math.max(configuredNext, maxExisting + 1);
  return `${prefix}${String(next).padStart(5, '0')}`;
}

async function bumpNextInvoiceNumber() {
  const current = Math.max(1, Number(state.company?.next_invoice_number || 1));
  const next = current + 1;
  state.company = { ...state.company, next_invoice_number: next };
  if (mode === 'local') {
    saveLocalState();
    return;
  }
  if (mode === 'supabase' && supabaseClient && state.company?.id) {
    try {
      await supabaseClient.from('companies').update({ next_invoice_number: next }).eq('id', state.company.id);
    } catch (error) {
      console.warn('No se pudo actualizar próximo número de factura en Supabase:', error.message || error);
    }
  }
}

function invoiceWhatsappMessage(invoice) {
  const client = getClient(invoice.client_id);
  const company = state.company || defaultCompany;
  return [
    `Hola ${client?.name || ''},`,
    `Te compartimos la factura comercial ${invoice.invoice_number} de ${company.name || 'nuestra empresa'}.`,
    `Total: ${money(invoiceTotals(invoice).total)}.`,
    `Saldo pendiente: ${money(invoiceBalance(invoice))}.`,
    invoice.due_date ? `Vence: ${invoice.due_date}.` : '',
    'Quedamos atentos.'
  ].filter(Boolean).join('\n');
}

async function saveInvoiceToStorage(invoice) {
  const normalized = normalizeInvoice(invoice);
  if (mode === 'supabase' && supabaseClient && state.invoiceStorageMode === 'supabase') {
    const invoicePayload = {
      company_id: state.company.id,
      client_id: normalized.client_id || null,
      quote_id: normalized.quote_id || null,
      invoice_number: normalized.invoice_number,
      status: normalized.status,
      issue_date: normalized.issue_date,
      due_date: normalized.due_date || null,
      currency: normalized.currency,
      tax_rate: normalized.tax_rate,
      discount_amount: normalized.discount_amount,
      notes: normalized.notes,
      terms: normalized.terms,
      document_type: normalized.document_type,
      fiscal_number: normalized.fiscal_number || null,
      fiscal_status: normalized.fiscal_status,
      fiscal_receipt_type: normalized.fiscal_receipt_type,
      fiscal_provider: normalized.fiscal_provider || null,
      fiscal_sync_status: normalized.fiscal_sync_status,
      business_context: normalized.business_context,
      source_type: normalized.source_type,
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabaseClient.from('invoices').insert(invoicePayload).select('*').single();
    if (error) throw error;
    const itemsPayload = normalized.items.map((item, index) => ({
      invoice_id: data.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
      position: index
    }));
    if (itemsPayload.length) {
      const { error: itemsError } = await supabaseClient.from('invoice_items').insert(itemsPayload);
      if (itemsError) throw itemsError;
    }
    await loadInvoices();
    return normalizeInvoice({ ...data, items: normalized.items, payments: [] });
  }

  state.invoices.unshift(normalized);
  if (mode === 'local') saveLocalState();
  else saveInvoicesLocalFallback();
  return normalized;
}

async function updateInvoiceInStorage(invoice) {
  const normalized = normalizeInvoice(invoice);
  if (mode === 'supabase' && supabaseClient && state.invoiceStorageMode === 'supabase') {
    const { error } = await supabaseClient
      .from('invoices')
      .update({
        status: normalized.status,
        due_date: normalized.due_date || null,
        notes: normalized.notes,
        terms: normalized.terms,
        fiscal_receipt_type: normalized.fiscal_receipt_type,
        fiscal_provider: normalized.fiscal_provider || null,
        fiscal_sync_status: normalized.fiscal_sync_status,
        void_reason: normalized.void_reason || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', normalized.id);
    if (error) throw error;
    await loadInvoices();
    return;
  }
  state.invoices = (state.invoices || []).map(inv => inv.id === normalized.id ? normalized : inv);
  if (mode === 'local') saveLocalState();
  else saveInvoicesLocalFallback();
}

async function convertQuoteToInvoice(quoteId) {
  if (!guardAction('invoice_create')) return;
  const quote = state.quotes.find(q => q.id === quoteId);
  if (!quote) return;
  const existing = quoteInvoice(quoteId);
  if (existing) {
    toast('Esta cotización ya tiene una factura activa.');
    setRoute(`invoice-view/${existing.id}`);
    render();
    return;
  }
  if (!quote.client_id) {
    toast('La cotización necesita un cliente antes de facturar.');
    return;
  }
  if (!(quote.items || []).length) {
    toast('La cotización no tiene items para facturar.');
    return;
  }
  const profile = getBusinessInvoiceProfile();
  const issueDate = todayISO();
  const dueDays = Number(state.company?.default_invoice_due_days ?? profile.dueDays ?? 15);
  const invoice = normalizeInvoice({
    company_id: state.company?.id || 'local-company',
    client_id: quote.client_id,
    quote_id: quote.id,
    invoice_number: nextInvoiceNumber(),
    status: 'draft',
    issue_date: issueDate,
    due_date: addDaysISO(dueDays),
    currency: quote.currency || state.company?.currency || 'USD',
    tax_rate: Number(quote.tax_rate ?? state.company?.tax_rate ?? 0),
    notes: state.company?.default_invoice_notes || defaultCompany.default_invoice_notes,
    terms: state.company?.default_invoice_terms || '',
    business_context: profile.context,
    source_type: 'quote',
    items: (quote.items || []).map((item, index) => ({ ...item, id: uid('inv_item'), position: index }))
  });
  const saved = await saveInvoiceToStorage(invoice);
  if (quote.status !== 'accepted') {
    quote.status = 'accepted';
    quote.accepted_at = quote.accepted_at || new Date().toISOString();
    if (mode === 'local') saveLocalState();
    else {
      try { await supabaseClient.from('quotes').update({ status: 'accepted', accepted_at: quote.accepted_at, updated_at: new Date().toISOString() }).eq('id', quote.id); } catch (_error) {}
    }
  }
  await bumpNextInvoiceNumber();
  toast('Factura creada en borrador. Revísala antes de emitir.');
  setRoute(`invoice-view/${saved.id}`);
  render();
}

async function issueInvoice(id) {
  if (!guardAction('invoice_issue')) return;
  const invoice = state.invoices.find(inv => inv.id === id);
  if (!invoice) return;
  if (invoice.status === 'void') return toast('No puedes emitir una factura anulada.');
  invoice.status = invoiceBalance(invoice) <= 0 && invoicePaidAmount(invoice) > 0 ? 'paid' : 'issued';
  await updateInvoiceInStorage(invoice);
  toast('Factura emitida. A partir de ahora debe manejarse por pagos o anulación.');
  setRoute(`invoice-view/${id}`);
  render();
}

async function voidInvoice(id) {
  if (!guardAction('invoice_void')) return;
  const invoice = state.invoices.find(inv => inv.id === id);
  if (!invoice) return;
  const reason = prompt('Motivo de anulación:', 'Error en factura / cliente canceló');
  if (reason === null) return;
  invoice.status = 'void';
  invoice.void_reason = reason;
  await updateInvoiceInStorage(invoice);
  toast('Factura anulada.');
  setRoute(`invoice-view/${id}`);
  render();
}

async function saveInvoicePayment(form) {
  if (!guardAction('invoice_payment')) return;
  const fd = new FormData(form);
  const invoiceId = String(fd.get('invoice_id') || '');
  const invoice = state.invoices.find(inv => inv.id === invoiceId);
  if (!invoice) return;
  if (invoice.status === 'void') return toast('No puedes registrar pagos en una factura anulada.');
  const payment = normalizeInvoicePayment({
    invoice_id: invoiceId,
    payment_date: fd.get('payment_date'),
    amount: Number(fd.get('amount') || 0),
    method: fd.get('method'),
    reference: fd.get('reference'),
    notes: fd.get('notes')
  });
  if (payment.amount <= 0) return toast('El pago debe ser mayor que cero.');
  if (payment.amount > invoiceBalance(invoice) + 0.01) return toast('El pago supera el saldo pendiente.');

  if (mode === 'supabase' && supabaseClient && state.invoiceStorageMode === 'supabase') {
    const { error } = await supabaseClient.from('invoice_payments').insert({
      invoice_id: invoiceId,
      company_id: state.company.id,
      payment_date: payment.payment_date,
      amount: payment.amount,
      method: payment.method,
      reference: payment.reference,
      notes: payment.notes
    });
    if (error) throw error;
    await loadInvoices();
  } else {
    invoice.payments = [payment, ...(invoice.payments || [])];
    const status = invoiceBalance(invoice) <= 0 ? 'paid' : invoice.status === 'draft' ? 'draft' : 'partially_paid';
    invoice.status = status;
    state.invoices = state.invoices.map(inv => inv.id === invoiceId ? normalizeInvoice(invoice) : inv);
    if (mode === 'local') saveLocalState();
    else saveInvoicesLocalFallback();
  }
  toast('Pago registrado.');
  setRoute(`invoice-view/${invoiceId}`);
  render();
}

async function copyInvoiceWhatsapp(id) {
  const invoice = state.invoices.find(inv => inv.id === id);
  if (!invoice) return;
  await navigator.clipboard.writeText(invoiceWhatsappMessage(invoice));
  toast('Mensaje de factura copiado.');
}

function renderInvoiceIntelligenceCard() {
  const profile = getBusinessInvoiceProfile();
  const stats = getInvoiceAnalytics();
  const warnings = [];
  if (state.company?.business_type === 'asociacion_ganaderos') warnings.push(profile.warning);
  if (stats.overdue.length) warnings.push(`${stats.overdue.length} factura(s) están vencidas. Prioriza cobro antes de emitir más crédito.`);
  if (!state.company?.invoice_prefix) warnings.push('Configura prefijo y próximo número en Configuración > Empresa para mantener orden interno.');
  if (String(state.company?.fiscal_integration_status || 'not_enabled') !== 'enabled_backend') warnings.push('Factura comercial interna: no sustituye comprobante fiscal oficial NCF/e-CF.');
  return `
    <section class="card insight info" style="margin-bottom:18px;">
      <strong>${escapeHtml(profile.title)}</strong>
      <span>${escapeHtml(profile.subtitle)}</span>
      ${warnings.length ? `<div class="mini-list">${warnings.map(w => `<span>${escapeHtml(w)}</span>`).join('')}</div>` : ''}
    </section>
  `;
}

function renderInvoices() {
  const stats = getInvoiceAnalytics();
  const invoices = stats.invoices.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  return `
    <div class="page-header">
      <div>
        <h1>Facturas comerciales</h1>
        <p>Convierte cotizaciones en documentos comerciales internos, registra pagos y controla saldos pendientes.</p>
      </div>
      <div class="header-actions">
        <button class="btn secondary" data-route="quotes">Crear desde cotización</button>
      </div>
    </div>
    ${renderInvoiceIntelligenceCard()}
    <section class="grid cols-4">
      <div class="card metric"><span>Emitidas</span><strong>${stats.issuedCount}</strong></div>
      <div class="card metric"><span>Borradores</span><strong>${stats.draftCount}</strong></div>
      <div class="card metric"><span>Cuentas por cobrar</span><strong>${money(stats.totalReceivable)}</strong></div>
      <div class="card metric"><span>Cobrado</span><strong>${money(stats.totalPaid)}</strong></div>
    </section>
    <section class="card" style="margin-top:18px;">
      ${invoices.length ? renderInvoicesTable(invoices) : `<div class="empty">No hay facturas comerciales todavía. Abre una cotización aceptada o enviada y presiona “Convertir en factura comercial comercial”.</div>`}
    </section>
  `;
}

function renderInvoicesTable(invoices) {
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Número</th><th>Cliente</th><th>Estado</th><th>Total</th><th>Pagado</th><th>Saldo</th><th>Vence</th><th>Acciones</th></tr></thead>
        <tbody>
          ${invoices.map(invoice => {
            const client = getClient(invoice.client_id);
            const totals = invoiceTotals(invoice);
            const paid = invoicePaidAmount(invoice);
            const balance = invoiceBalance(invoice);
            const status = effectiveInvoiceStatus(invoice);
            return `
              <tr class="${status === 'overdue' ? 'row-warning' : ''}">
                <td><strong>${escapeHtml(invoice.invoice_number)}</strong><br><span class="help">${escapeHtml(invoice.issue_date)}</span></td>
                <td>${escapeHtml(client?.name || 'Sin cliente')}</td>
                <td>${invoiceStatusBadge(status)}</td>
                <td>${money(totals.total)}</td>
                <td>${money(paid)}</td>
                <td>${money(balance)}</td>
                <td>${escapeHtml(invoice.due_date || '')}</td>
                <td class="actions"><button class="btn secondary small" data-route="invoice-view/${invoice.id}">Ver</button><button class="btn secondary small" data-action="invoice-pdf" data-id="${invoice.id}">PDF</button></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderInvoiceView(id) {
  const invoice = normalizeInvoice(state.invoices.find(inv => inv.id === id));
  if (!invoice?.id || !state.invoices.find(inv => inv.id === id)) return `<div class="empty">Factura no encontrada.</div>`;
  const client = getClient(invoice.client_id);
  const quote = state.quotes.find(q => q.id === invoice.quote_id);
  const totals = invoiceTotals(invoice);
  const paid = invoicePaidAmount(invoice);
  const balance = invoiceBalance(invoice);
  const effectiveStatus = effectiveInvoiceStatus(invoice);
  const canPay = can('invoices_payments') && canUseFeature('partial_payments') && !isSubscriptionBlocked() && invoice.status !== 'void' && balance > 0 && invoice.status !== 'draft';
  return `
    <div class="page-header">
      <div>
        <h1>${escapeHtml(state.company?.invoice_document_label || 'Factura comercial')} ${escapeHtml(invoice.invoice_number)}</h1>
        <p>${escapeHtml(client?.name || 'Sin cliente')} · ${invoiceStatusBadge(effectiveStatus)}</p>
      </div>
      <div class="header-actions">
        <button class="btn secondary" data-route="invoices">Volver</button>
        <button class="btn secondary" data-action="invoice-pdf" data-id="${invoice.id}">PDF</button>
        <button class="btn secondary" data-action="copy-invoice-whatsapp" data-id="${invoice.id}">WhatsApp</button>
        ${invoice.status === 'draft' && can('invoices_write') ? `<button class="btn primary" data-action="issue-invoice" data-id="${invoice.id}">Emitir</button>` : ''}
        ${invoice.status !== 'void' && can('invoices_void') ? `<button class="btn danger" data-action="void-invoice" data-id="${invoice.id}">Anular</button>` : ''}
      </div>
    </div>

    <section class="grid cols-4">
      <div class="card metric"><span>Total</span><strong>${money(totals.total)}</strong></div>
      <div class="card metric"><span>Pagado</span><strong>${money(paid)}</strong></div>
      <div class="card metric"><span>Saldo</span><strong>${money(balance)}</strong></div>
      <div class="card metric"><span>Vence</span><strong>${escapeHtml(invoice.due_date || '-')}</strong></div>
    </section>

    ${state.company?.business_type === 'asociacion_ganaderos' ? `<section class="card insight warning" style="margin-top:18px;"><strong>Regla ganadera</strong><span>Esta factura representa ventas de insumos/servicios. La leche recibida y el pago al productor se manejan por Control Diario y liquidación mensual.</span></section>` : ''}
    <section class="card insight info" style="margin-top:18px;"><strong>Documento comercial interno</strong><span>Este documento ayuda a cobrar y controlar saldos. No sustituye comprobante fiscal oficial hasta activar integración NCF/e-CF mediante backend seguro.</span></section>

    <section class="card" style="margin-top:18px;">
      <h2>Detalle</h2>
      <div class="summary-line"><span>Cliente</span><strong>${escapeHtml(client?.name || '')}</strong></div>
      <div class="summary-line"><span>Cotización origen</span><strong>${quote ? escapeHtml(quote.quote_number) : 'Manual / sin cotización'}</strong></div>
      <div class="summary-line"><span>Tipo</span><strong>${escapeHtml(state.company?.invoice_document_label || 'Factura comercial interna')}</strong></div>
      <div class="summary-line"><span>Fiscal</span><strong>${invoice.fiscal_number ? escapeHtml(invoice.fiscal_number) : 'No fiscal / NCF-eCF futuro'}</strong></div>
      <div class="summary-line"><span>Comprobante</span><strong>${escapeHtml(invoice.fiscal_receipt_type || state.company?.default_fiscal_receipt_type || 'none')}</strong></div>
    </section>

    <section class="card" style="margin-top:18px;">
      <h2>Items</h2>
      <div class="table-wrap compact-table"><table><thead><tr><th>Descripción</th><th>Cantidad</th><th>Precio</th><th>Total</th></tr></thead><tbody>
        ${invoice.items.map(item => `<tr><td>${escapeHtml(item.description)}</td><td>${numberFmt(item.quantity)}</td><td>${money(item.unit_price)}</td><td>${money(item.total)}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="totals-box">
        <div><span>Subtotal</span><strong>${money(totals.subtotal)}</strong></div>
        <div><span>Descuento</span><strong>${money(totals.discount)}</strong></div>
        <div><span>Impuesto</span><strong>${money(totals.tax)}</strong></div>
        <div><span>Total</span><strong>${money(totals.total)}</strong></div>
      </div>
    </section>

    <section class="grid cols-2" style="margin-top:18px;">
      <div class="card">
        <h2>Pagos</h2>
        ${invoice.payments.length ? renderInvoicePaymentsTable(invoice.payments) : `<div class="empty">Sin pagos registrados.</div>`}
      </div>
      <div class="card">
        <h2>Registrar pago</h2>
        ${canPay ? renderInvoicePaymentForm(invoice, balance) : `<div class="empty">${invoice.status === 'draft' ? 'Emite la factura antes de registrar pagos.' : 'No hay saldo pendiente o no tienes permiso.'}</div>`}
      </div>
    </section>
  `;
}

function renderInvoicePaymentsTable(payments) {
  return `
    <div class="table-wrap compact-table"><table><thead><tr><th>Fecha</th><th>Monto</th><th>Método</th><th>Referencia</th></tr></thead><tbody>
      ${payments.map(payment => `<tr><td>${escapeHtml(payment.payment_date)}</td><td>${money(payment.amount)}</td><td>${escapeHtml(payment.method)}</td><td>${escapeHtml(payment.reference || '-')}</td></tr>`).join('')}
    </tbody></table></div>
  `;
}

function renderInvoicePaymentForm(invoice, balance) {
  return `
    <form data-form="invoice-payment" class="form-grid one">
      <input type="hidden" name="invoice_id" value="${escapeHtml(invoice.id)}" />
      <div class="field"><label>Fecha</label><input name="payment_date" type="date" value="${todayISO()}" required /></div>
      <div class="field"><label>Monto</label><input name="amount" type="number" min="0.01" step="0.01" max="${balance}" value="${balance.toFixed(2)}" required /></div>
      <div class="field"><label>Método</label><select name="method"><option value="efectivo">Efectivo</option><option value="transferencia" selected>Transferencia</option><option value="tarjeta">Tarjeta</option><option value="cheque">Cheque</option><option value="otro">Otro</option></select></div>
      <div class="field"><label>Referencia</label><input name="reference" placeholder="No. transferencia, recibo, cheque" /></div>
      <div class="field"><label>Nota</label><textarea name="notes" placeholder="Opcional"></textarea></div>
      <button class="btn primary" type="submit">Guardar pago</button>
    </form>
  `;
}

function generateInvoicePdf(id) {
  const invoice = normalizeInvoice(state.invoices.find(inv => inv.id === id));
  if (!invoice || !state.invoices.find(inv => inv.id === id)) return;
  if (!window.jspdf?.jsPDF) {
    toast('jsPDF no está disponible. Revisa tu conexión.');
    return;
  }
  const client = getClient(invoice.client_id);
  const totals = invoiceTotals(invoice);
  const doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'letter' });
  if (getEffectivePlan().lockedPdfWatermark) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(46);
    doc.setTextColor(220, 220, 220);
    doc.text('DEMO', 245, 390, { angle: 35 });
    doc.setTextColor(0, 0, 0);
  }
  const left = 44;
  const right = 568;
  const company = state.company || defaultCompany;
  let y = 48;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(company.name || 'CotizaFlow', left, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  y += 16;
  doc.text(`${company.tax_id || ''}  ${company.email || ''}  ${company.phone || ''}`, left, y);
  if (company.address) {
    y += 13;
    doc.text(doc.splitTextToSize(company.address, 300), left, y);
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(String(company.invoice_document_label || 'FACTURA COMERCIAL').toUpperCase(), 400, 48);
  doc.setFontSize(10);
  doc.text(invoice.invoice_number || '', 400, 65);
  doc.setFont('helvetica', 'normal');
  doc.text(`Estado: ${invoiceStatusLabel(effectiveInvoiceStatus(invoice))}`, 400, 82);
  doc.text(`Emisión: ${invoice.issue_date || ''}`, 400, 99);
  doc.text(`Vence: ${invoice.due_date || ''}`, 400, 116);
  y = 140;
  doc.line(left, y, right, y);
  y += 28;
  doc.setFont('helvetica', 'bold');
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
  invoice.items.forEach(item => {
    const description = doc.splitTextToSize(item.description || '', 285);
    doc.text(description, left, y);
    doc.text(String(Number(item.quantity || 0)), 350, y);
    doc.text(money(item.unit_price), 410, y);
    doc.text(money(item.total), 500, y);
    y += Math.max(18, description.length * 12 + 8);
    if (y > 680) { doc.addPage(); y = 48; }
  });
  y += 8;
  doc.line(360, y, right, y);
  y += 18;
  doc.text('Subtotal', 410, y); doc.text(money(totals.subtotal), 500, y);
  y += 16;
  doc.text('Descuento', 410, y); doc.text(money(totals.discount), 500, y);
  y += 16;
  doc.text('Impuesto', 410, y); doc.text(money(totals.tax), 500, y);
  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.text('Total', 410, y); doc.text(money(totals.total), 500, y);
  y += 18;
  doc.text('Pagado', 410, y); doc.text(money(invoicePaidAmount(invoice)), 500, y);
  y += 18;
  doc.text('Saldo', 410, y); doc.text(money(invoiceBalance(invoice)), 500, y);
  const footerText = [invoice.notes || '', invoice.terms ? `Términos: ${invoice.terms}` : '', 'Documento comercial interno. No sustituye comprobante fiscal oficial NCF/e-CF hasta activar integración fiscal mediante backend seguro.'].filter(Boolean).join('\n\n');
  if (footerText) {
    y += 34;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(doc.splitTextToSize(footerText, 500), left, y);
  }
  doc.save(`${invoice.invoice_number || 'factura'}.pdf`);
}


function renderQuotes() {
  return `
    <div class="page-header">
      <div>
        <h1>Cotizaciones</h1>
        <p>Crea, edita, marca estado y genera PDF.</p>
      </div>
      ${can('quotes_write') ? `<button class="btn primary" data-route="quote-new" ${canCreateQuote() ? '' : 'disabled'}>Nueva cotización</button>` : ''}
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
                    ${can('invoices_write') ? `<button class="btn secondary small" data-action="convert-quote-invoice" data-id="${quote.id}">Facturar comercial</button>` : ''}
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
  const invoices = getClientInvoices(client.id);
  const invoiceOpenBalance = invoices.reduce((sum, inv) => sum + invoiceBalance(inv), 0);
  const invoicePaid = invoices.reduce((sum, inv) => sum + invoicePaidAmount(inv), 0);
  const milkRecords = milkClientRecords(client);
  const milkLiters = milkRecords.reduce((sum, record) => sum + Number(record.liters || 0), 0);
  const milkNet = milkRecords.reduce((sum, record) => sum + Number(record.net_amount || 0), 0);
  return { quotes, totalQuoted, accepted, totalAccepted, pending, expired, lastQuote, lastFollowup, lastActivityAt, invoices, invoiceOpenBalance, invoicePaid, milkRecords, milkLiters, milkNet };
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
  const clientLimitReached = resourceLimitReached('clients') || isSubscriptionBlocked() || !canUseFeature('clients');
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
        ${clientLimitReached ? `<div class="notice warning">${escapeHtml(resourceLimitMessage('clients'))} Actualiza tu plan para registrar más clientes.</div>` : ''}
        <form data-form="client" class="form-grid two">
          <div class="field"><label>Nombre</label><input name="name" required placeholder="Cliente o empresa" ${clientLimitReached ? 'disabled' : ''} /></div>
          <div class="field"><label>Estado comercial</label><select name="commercial_status" ${clientLimitReached ? 'disabled' : ''}>${clientStatusOptions('lead')}</select></div>
          <div class="field"><label>Correo</label><input name="email" type="email" placeholder="cliente@email.com" ${clientLimitReached ? 'disabled' : ''} /></div>
          <div class="field"><label>Teléfono</label><input name="phone" placeholder="809-000-0000" ${clientLimitReached ? 'disabled' : ''} /></div>
          <div class="field" style="grid-column:1/-1;"><label>Etiquetas</label><input name="tags" placeholder="prioridad, taller, recurrente" ${clientLimitReached ? 'disabled' : ''} /></div>
          <div class="field" style="grid-column:1/-1;"><label>Dirección</label><textarea name="address" placeholder="Dirección comercial" ${clientLimitReached ? 'disabled' : ''}></textarea></div>
          <div class="field" style="grid-column:1/-1;"><label>Notas internas</label><textarea name="notes" placeholder="Preferencias, acuerdos, observaciones" ${clientLimitReached ? 'disabled' : ''}></textarea></div>
          <button class="btn primary" type="submit" ${clientLimitReached ? 'disabled' : ''}>Guardar cliente</button>
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
                    ${isDairyBusiness() && canOperateGanadero() && can('milk_write') ? `<button class="btn secondary small" data-route="milk" data-prefill-milk-client="${client.id}">Control Diario</button>` : ''}
                    ${stats.lastQuote ? `<button class="btn secondary small" data-route="quote-view/${stats.lastQuote.id}">Ver última</button>` : ''}
                    ${can('invoices_read') && stats.invoices.length ? `<button class="btn secondary small" data-route="invoices">Facturas: ${stats.invoices.length}</button>` : ''}
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
    ['settings', t('company'), 'Empresa, marca, temas y documentos comerciales', 'settings_company'],
    ['billing', t('billing'), 'Suscripción, límites y checkout', 'billing_manage'],
    ['team', t('users'), 'Superusuario, roles y permisos por usuario', 'users_manage'],
    ['diagnostics', 'Diagnóstico', 'QA interno, permisos, plan y módulos críticos', 'users_manage'],
    ['affiliates', t('affiliates'), 'Código, comisiones y enlace', 'affiliates_manage'],
    ['integrations', t('integrations'), 'Estado técnico y próximos conectores', 'integrations_manage']
  ].filter(([route, , , permission]) => can(permission) && canAccessPage(route === 'billing' ? 'billing' : route));
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
        <div class="field"><label>Prefijo factura</label><input name="invoice_prefix" value="${escapeHtml(c.invoice_prefix || getBusinessInvoiceProfile().prefix)}" /></div>
        <div class="field"><label>Próximo número factura</label><input name="next_invoice_number" type="number" min="1" step="1" value="${escapeHtml(c.next_invoice_number || 1)}" /></div>
        <div class="field"><label>Días de vencimiento factura comercial</label><input name="default_invoice_due_days" type="number" min="0" step="1" value="${escapeHtml(c.default_invoice_due_days ?? getBusinessInvoiceProfile().dueDays)}" /></div>
        <div class="field"><label>Etiqueta del documento</label><input name="invoice_document_label" value="${escapeHtml(c.invoice_document_label || 'Factura comercial interna')}" /></div>
        <div class="field"><label>Estado fiscal</label>
          <select name="fiscal_integration_status">
            ${[['not_enabled','No fiscal / interno'], ['planned','Preparado para NCF/e-CF futuro'], ['provider_required','Requiere proveedor fiscal'], ['enabled_backend','Fiscal activo vía backend']].map(([value, label]) => `<option value="${value}" ${String(c.fiscal_integration_status || 'not_enabled') === value ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
          <p class="help">Mientras no exista backend fiscal, el sistema emite solo facturas comerciales internas.</p>
        </div>
        <div class="field"><label>Proveedor fiscal futuro</label><input name="fiscal_provider" value="${escapeHtml(c.fiscal_provider || '')}" placeholder="Proveedor NCF/e-CF futuro" /></div>
        <div class="field"><label>Tipo comprobante por defecto</label>
          <select name="default_fiscal_receipt_type">
            ${[['none','No aplica'], ['b01','B01 Crédito fiscal'], ['b02','B02 Consumo'], ['b14','B14 Regímenes especiales'], ['b15','B15 Gubernamental'], ['ecf','e-CF futuro']].map(([value, label]) => `<option value="${value}" ${String(c.default_fiscal_receipt_type || 'none') === value ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
        </div>
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
        <div class="field" style="grid-column:1/-1;"><label>Notas por defecto en facturas comerciales</label><textarea name="default_invoice_notes">${escapeHtml(c.default_invoice_notes || defaultCompany.default_invoice_notes)}</textarea></div>
        <div class="field" style="grid-column:1/-1;"><label>Términos por defecto en facturas comerciales</label><textarea name="default_invoice_terms" placeholder="Ej.: Pago contra entrega, transferencia bancaria, crédito 15 días.">${escapeHtml(c.default_invoice_terms || '')}</textarea><p class="help">Este módulo genera documentos comerciales internos. NCF/e-CF fiscal requiere backend seguro y proveedor/flujo autorizado en una fase posterior.</p></div>
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
        ${can('invoices_write') ? `<button class="btn primary" data-action="convert-quote-invoice" data-id="${quote.id}">Convertir en factura comercial</button>` : ''}
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
  if (!canOperateGanadero()) return renderGanaderoUpgrade();
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
        <button class="btn secondary" data-route="milk-settlements">Liquidación mensual</button>
        ${can('milk_export') && canUseFeature('ganadero_csv') ? `<button class="btn secondary" data-action="milk-csv">Exportar CSV</button>` : `<button class="btn secondary" data-route="billing">CSV en Ganadero Pro</button>`}
        ${can('milk_export') && canUseFeature('ganadero_pdf') ? `<button class="btn primary" data-action="milk-pdf">PDF mensual</button>` : `<button class="btn primary" data-route="billing">PDF en Ganadero Pro</button>`}
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
          <button class="btn primary" type="submit" ${can('milk_write') && canUseFeature('ganadero_daily_control') && hasWritableSubscription() ? '' : 'disabled'}>Registrar llegada</button>
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
              <td>${can('milk_delete') && hasWritableSubscription() ? `<button class="btn danger small" data-action="delete-milk-record" data-id="${escapeHtml(record.id)}">Borrar</button>` : `<span class="badge muted">Solo lectura</span>`}</td>
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
  if (!guardAction('milk_create')) return;
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
  if (!guardAction('milk_delete')) return;
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
  if (!guardAction('milk_pdf')) return;
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
  if (!guardAction('milk_csv')) return;
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


function getProducerInvoiceRowsForMonth(month) {
  const selected = month || state.milkFilters?.month || currentMonthValue();
  const producerIds = new Set((state.milkRecords || []).filter(record => String(record.delivery_date || '').startsWith(selected)).map(record => String(record.client_id || '')).filter(Boolean));
  return (state.invoices || [])
    .map(inv => normalizeInvoice(inv))
    .filter(inv => producerIds.has(String(inv.client_id || '')))
    .filter(inv => {
      const status = effectiveInvoiceStatus(inv);
      if (status === 'void') return false;
      return invoiceBalance(inv) > 0;
    })
    .map(inv => ({
      invoice: inv,
      client: getClient(inv.client_id),
      total: invoiceTotals(inv).total,
      paid: invoicePaidAmount(inv),
      balance: invoiceBalance(inv),
      status: effectiveInvoiceStatus(inv),
      isDraft: effectiveInvoiceStatus(inv) === 'draft'
    }));
}

function getMilkSettlements(month) {
  const records = getMilkRecordsForMonth(month);
  const milkSummary = summarizeMilkByProducer(records);
  const invoiceRows = getProducerInvoiceRowsForMonth(month);
  const invoiceByClient = new Map();
  invoiceRows.forEach(row => {
    const key = String(row.invoice.client_id || '');
    if (!invoiceByClient.has(key)) invoiceByClient.set(key, { invoices: 0, drafts: 0, total: 0, paid: 0, balance: 0, rows: [] });
    const group = invoiceByClient.get(key);
    group.invoices += 1;
    if (row.isDraft) group.drafts += 1;
    group.total += row.total;
    group.paid += row.paid;
    group.balance += row.balance;
    group.rows.push(row);
  });

  return milkSummary.map(row => {
    const clientKey = String(row.client_id || '');
    const invoice = invoiceByClient.get(clientKey) || { invoices: 0, drafts: 0, total: 0, paid: 0, balance: 0, rows: [] };
    const netPayable = Number(row.net || 0) - Number(invoice.balance || 0);
    return {
      ...row,
      invoice_count: invoice.invoices,
      invoice_draft_count: invoice.drafts || 0,
      invoice_total: invoice.total,
      invoice_paid: invoice.paid,
      invoice_balance: invoice.balance,
      net_payable: netPayable,
      settlement_status: netPayable > 0 ? 'pay_producer' : netPayable < 0 ? 'producer_owes' : 'closed',
      invoice_rows: invoice.rows
    };
  }).sort((a, b) => b.net_payable - a.net_payable);
}

function settlementStatusLabel(status) {
  return {
    pay_producer: 'Pagar al productor',
    producer_owes: 'Productor debe saldo',
    closed: 'Cerrado'
  }[String(status || '')] || 'Pendiente';
}

function renderSettlementStatusBadge(status) {
  const css = { pay_producer: 'accepted', producer_owes: 'warning', closed: 'sent' }[String(status || '')] || 'draft';
  return `<span class="badge ${escapeHtml(css)}">${escapeHtml(settlementStatusLabel(status))}</span>`;
}

function renderMilkSettlements() {
  if (!canOperateGanadero() || !canUseFeature('ganadero_monthly_summary')) return renderGanaderoUpgrade();
  const month = state.milkFilters?.month || currentMonthValue();
  const settlements = getMilkSettlements(month);
  const totals = settlements.reduce((acc, row) => {
    acc.liters += Number(row.liters || 0);
    acc.gross += Number(row.gross || 0);
    acc.commission += Number(row.commission || 0);
    acc.milkNet += Number(row.net || 0);
    acc.invoiceBalance += Number(row.invoice_balance || 0);
    acc.netPayable += Number(row.net_payable || 0);
    return acc;
  }, { liters: 0, gross: 0, commission: 0, milkNet: 0, invoiceBalance: 0, netPayable: 0 });

  return `
    <div class="page-header">
      <div>
        <h1>Liquidaciones ganaderas</h1>
        <p>Cierre mensual por productor: leche recibida menos comisión de la asociación y menos facturas comerciales pendientes por insumos o servicios.</p>
      </div>
      <div class="header-actions">
        <button class="btn secondary" data-route="milk">Control Diario</button>
        ${can('milk_export') && canUseFeature('ganadero_csv') ? `<button class="btn secondary" data-action="milk-settlement-csv">Exportar CSV</button>` : `<button class="btn secondary" data-route="billing">CSV en Ganadero Pro</button>`}
        ${can('milk_export') && canUseFeature('ganadero_pdf') ? `<button class="btn primary" data-action="milk-settlement-pdf">PDF liquidación</button>` : `<button class="btn primary" data-route="billing">PDF en Ganadero Pro</button>`}
      </div>
    </div>

    <div class="notice info">
      La liquidación no es una factura fiscal. Es un reporte operativo interno para calcular lo que debe pagarse a cada productor al cierre del mes. Las facturas comerciales pendientes del productor se descuentan del neto de leche. Para fines operativos, también se incluyen facturas en borrador con saldo pendiente hasta que sean emitidas, pagadas o anuladas.
    </div>

    <section class="grid cols-4 dairy-metrics" style="margin-top:18px;">
      <div class="card metric"><span>Litros liquidados</span><strong>${numberFmt(totals.liters, 2)}</strong></div>
      <div class="card metric"><span>Neto de leche</span><strong>${money(totals.milkNet)}</strong></div>
      <div class="card metric"><span>Descuentos por facturas</span><strong>${money(totals.invoiceBalance)}</strong></div>
      <div class="card metric"><span>Neto final</span><strong>${money(totals.netPayable)}</strong></div>
    </section>

    <section class="card" style="margin-top:18px;">
      <form data-form="milk-settlement-filters" class="form-grid two">
        <div class="field"><label>Mes de liquidación</label><input name="month" type="month" value="${escapeHtml(month)}" /></div>
        <button class="btn secondary" type="submit">Ver liquidación</button>
      </form>
    </section>

    <section class="card" style="margin-top:18px;">
      <h2>Liquidación por productor</h2>
      ${settlements.length ? renderMilkSettlementTable(settlements) : `<div class="empty">No hay entregas de leche para liquidar en este mes.</div>`}
    </section>

    <section class="grid cols-2" style="margin-top:18px; align-items:start;">
      <div class="card">
        <h2>Cómo se calcula</h2>
        <div class="bullets">
          <span>Bruto de leche = litros recibidos × precio por litro configurado.</span>
          <span>Neto de leche = bruto de leche - comisión de la asociación.</span>
          <span>Descuentos = saldo pendiente de facturas comerciales del productor, incluyendo borradores operativos no anulados.</span>
          <span>Neto final = neto de leche - descuentos por facturas.</span>
        </div>
      </div>
      <div class="card">
        <h2>Uso recomendado</h2>
        <div class="bullets">
          <span>Registra ventas de alimento, medicina, transporte o servicios como facturas comerciales al productor.</span>
          <span>Al cierre del mes, usa esta pantalla para descontar esas cuentas del pago de leche.</span>
          <span>Exporta PDF para archivo interno y CSV para contabilidad.</span>
        </div>
      </div>
    </section>
  `;
}

function renderMilkSettlementTable(rows) {
  return `
    <div class="table-wrap compact-table">
      <table>
        <thead>
          <tr><th>Productor</th><th>Litros</th><th>Bruto leche</th><th>Comisión</th><th>Neto leche</th><th>Facturas pendientes</th><th>Neto final</th><th>Estado</th></tr>
        </thead>
        <tbody>${rows.map(row => `
          <tr>
            <td><strong>${escapeHtml(row.producer_name)}</strong><br><span class="help">${row.records} registros · ${row.days} días</span></td>
            <td>${numberFmt(row.liters, 2)}</td>
            <td>${money(row.gross)}</td>
            <td>${money(row.commission)}</td>
            <td>${money(row.net)}</td>
            <td>${money(row.invoice_balance)}${row.invoice_count ? `<br><span class="help">${row.invoice_count} factura(s)${row.invoice_draft_count ? ` · ${row.invoice_draft_count} borrador(es)` : ''}</span>` : ''}</td>
            <td><strong>${money(row.net_payable)}</strong></td>
            <td>${renderSettlementStatusBadge(row.settlement_status)}</td>
          </tr>
        `).join('')}</tbody>
      </table>
    </div>
  `;
}

function handleMilkSettlementFilters(form) {
  const fd = new FormData(form);
  state.milkFilters = { month: String(fd.get('month') || currentMonthValue()) };
  saveLocalState();
  setRoute('milk-settlements');
  render();
}

function generateMilkSettlementPdf() {
  if (!guardAction('milk_pdf')) return;
  if (!window.jspdf?.jsPDF) {
    toast('jsPDF no está disponible. Revisa tu conexión.');
    return;
  }
  const month = state.milkFilters?.month || currentMonthValue();
  const settlements = getMilkSettlements(month);
  const doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'letter' });
  const left = 44;
  let y = 48;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('Liquidación mensual de productores', left, y);
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${state.company?.name || 'Asociación'} · Mes: ${month}`, left, y);
  y += 24;
  doc.setFontSize(8);
  doc.text('Reporte interno: neto de leche menos saldos pendientes por facturas comerciales de insumos o servicios.', left, y);
  y += 26;

  doc.setFont('helvetica', 'bold');
  doc.text('Productor', left, y);
  doc.text('Litros', 170, y);
  doc.text('Neto leche', 235, y);
  doc.text('Facturas', 330, y);
  doc.text('Neto final', 425, y);
  doc.text('Estado', 510, y);
  y += 8;
  doc.line(left, y, 568, y);
  y += 18;
  doc.setFont('helvetica', 'normal');
  settlements.forEach(row => {
    if (y > 720) { doc.addPage(); y = 48; }
    doc.text(String(row.producer_name).slice(0, 24), left, y);
    doc.text(numberFmt(row.liters, 2), 170, y);
    doc.text(money(row.net), 235, y);
    doc.text(money(row.invoice_balance), 330, y);
    doc.text(money(row.net_payable), 425, y);
    doc.text(settlementStatusLabel(row.settlement_status).slice(0, 18), 510, y);
    y += 18;
  });

  const totals = settlements.reduce((acc, row) => {
    acc.liters += Number(row.liters || 0);
    acc.net += Number(row.net || 0);
    acc.invoiceBalance += Number(row.invoice_balance || 0);
    acc.netPayable += Number(row.net_payable || 0);
    return acc;
  }, { liters: 0, net: 0, invoiceBalance: 0, netPayable: 0 });
  y += 10;
  doc.line(left, y, 568, y);
  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.text('Totales', left, y);
  doc.text(numberFmt(totals.liters, 2), 170, y);
  doc.text(money(totals.net), 235, y);
  doc.text(money(totals.invoiceBalance), 330, y);
  doc.text(money(totals.netPayable), 425, y);
  doc.save(`liquidacion-ganadera-${month}.pdf`);
}

function exportMilkSettlementCsv() {
  if (!guardAction('milk_csv')) return;
  const month = state.milkFilters?.month || currentMonthValue();
  const settlements = getMilkSettlements(month);
  if (!settlements.length) {
    toast('No hay liquidaciones para exportar.');
    return;
  }
  const rows = [['mes','productor','cliente_id','dias','registros','litros','bruto_leche','comision_asociacion','neto_leche','facturas_pendientes','neto_final','estado']];
  settlements.forEach(row => rows.push([month,row.producer_name,row.client_id || '',row.days,row.records,row.liters,row.gross,row.commission,row.net,row.invoice_balance,row.net_payable,settlementStatusLabel(row.settlement_status)]));
  downloadTextFile(`liquidacion-ganadera-${month}.csv`, rows.map(row => row.map(csvEscape).join(',')).join('\n'), 'text/csv;charset=utf-8');
  recordExportUsage('milk_settlement_csv');
  toast('CSV de liquidación generado.');
}


function renderTeamMembers() {
  const members = state.teamMembers || [];
  const activeMembers = members.filter(member => String(member.status || 'active') === 'active');
  const ownerEmail = normalizeEmail(state.session?.email || '');
  return `
    <div class="page-header">
      <div>
        <h1>Usuarios y roles</h1>
        <p>Solo el Superusuario puede ver y administrar esta vista. Define quién puede cotizar, registrar Control Diario, ver reportes, administrar pagos o configurar la empresa.</p>
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
          <label class="checkbox-line"><input type="checkbox" name="send_setup" value="1" /> Enviar correo de recuperación/activación al guardar</label>
          <p class="help">Este registro define el rol dentro de la empresa. Solo el Superusuario puede ver esta vista. Para poder entrar, el correo también debe existir en Supabase Auth: el usuario puede crear cuenta con ese mismo correo o usar “Olvidé contraseña” si ya existe. Crear el rol aquí no crea una contraseña directamente desde el frontend.</p>
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
                const isProtectedSuperuser = isPlatformSuperuserEmail(member.email);
                const isInactive = String(member.status || 'active') !== 'active';
                return `
                  <tr>
                    <td><strong>${escapeHtml(member.full_name || 'Sin nombre')}</strong>${isSelf ? '<br><span class="help">Tu usuario</span>' : ''}</td>
                    <td>${escapeHtml(member.email || '')}</td>
                    <td>${escapeHtml(roleLabel(roleKey))}</td>
                    <td><span class="help">${escapeHtml(roleDescription(roleKey))}</span></td>
                    <td>${String(member.status || 'active') === 'active' ? '<span class="status accepted">Activo</span>' : '<span class="status rejected">Inactivo</span>'}</td>
                    <td>
                      <div class="row-actions">
                        <button class="btn secondary small" data-action="send-setup-email" data-email="${escapeHtml(member.email || '')}">Enviar acceso</button>
                        ${isProtectedSuperuser ? '<span class="help">Protegido</span>' : `
                          ${isInactive ? `<button class="btn secondary small" data-action="activate-team-member" data-id="${escapeHtml(member.id)}">Activar</button>` : `<button class="btn warning small" data-action="deactivate-team-member" data-id="${escapeHtml(member.id)}">Desactivar</button>`}
                          <button class="btn danger small" data-action="delete-team-member" data-id="${escapeHtml(member.id)}">Eliminar</button>
                        `}
                      </div>
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
  if (payload.role === 'superuser' && !isPlatformSuperuserEmail(payload.email)) {
    payload.role = 'admin';
    toast('Solo ' + PLATFORM_SUPERUSER_EMAIL + ' puede tener rol Superusuario. El usuario se guardará como Administrador.');
  }
  if (isPlatformSuperuserEmail(payload.email)) {
    payload.role = 'superuser';
    payload.status = 'active';
    if (payload.email === normalizeEmail(state.session?.email)) payload.user_id = state.session.id;
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
  const sendSetup = fd.get('send_setup') === '1';
  if (sendSetup && mode === 'supabase') {
    await sendUserSetupEmail(payload.email, false);
    toast('Usuario guardado. Si el correo existe en Auth, se envió el acceso.');
  } else {
    toast('Usuario y rol guardados.');
  }
  form.reset();
  setRoute('team');
  render();
}

async function sendUserSetupEmail(email, shouldRender = true) {
  if (mode !== 'supabase') {
    toast('Supabase no está configurado.');
    return;
  }
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    toast('No hay correo válido para enviar acceso.');
    return;
  }
  const { error } = await supabaseClient.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: recoveryRedirectUrl()
  });
  if (error) throw error;
  if (shouldRender) toast('Correo enviado. Si el usuario existe en Supabase Auth, recibirá el enlace o código de recuperación.');
}

async function deactivateTeamMember(id) {
  if (!requirePermission('users_manage')) return;
  const member = (state.teamMembers || []).find(item => String(item.id) === String(id));
  if (!member) return;
  if (isPlatformSuperuserEmail(member.email)) {
    toast('No puedes desactivar el Superusuario principal.');
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

async function activateTeamMember(id) {
  if (!requirePermission('users_manage')) return;
  const member = (state.teamMembers || []).find(item => String(item.id) === String(id));
  if (!member) return;
  if (mode === 'supabase') {
    const { error } = await supabaseClient
      .from('company_members')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    await loadTeamMembers();
  } else {
    state.teamMembers = state.teamMembers.map(item => String(item.id) === String(id) ? { ...item, status: 'active', updated_at: new Date().toISOString() } : item);
    saveLocalState();
  }
  toast('Usuario activado.');
  setRoute('team');
  render();
}

async function deleteTeamMember(id) {
  if (!requirePermission('users_manage')) return;
  const member = (state.teamMembers || []).find(item => String(item.id) === String(id));
  if (!member) return;
  if (isPlatformSuperuserEmail(member.email)) {
    toast('No puedes eliminar el Superusuario principal.');
    return;
  }
  if (!confirm('¿Eliminar este usuario de Roles actuales? Esto no borra la cuenta de Supabase Auth, solo su acceso a esta empresa.')) return;
  if (mode === 'supabase') {
    const { error } = await supabaseClient
      .from('company_members')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await loadTeamMembers();
  } else {
    state.teamMembers = (state.teamMembers || []).filter(item => String(item.id) !== String(id));
    saveLocalState();
  }
  toast('Usuario eliminado de Roles actuales.');
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


function diagnosticBadge(ok, warn = false) {
  if (ok) return '<span class="badge success">OK</span>';
  if (warn) return '<span class="badge warning">Revisar</span>';
  return '<span class="badge danger">Falla</span>';
}

function diagnosticRow(label, statusHtml, detail = '') {
  return `
    <tr>
      <td><strong>${escapeHtml(label)}</strong></td>
      <td>${statusHtml}</td>
      <td>${escapeHtml(detail || '')}</td>
    </tr>
  `;
}

function moduleDiagnosticRows() {
  const rows = [
    ['Dashboard', 'dashboard_basic', can('dashboard_read'), true],
    ['Seguimiento', 'follow_up', can('reports_read'), true],
    ['Clientes', 'clients', can('clients_read'), true],
    ['Cotizaciones', 'quotes', can('quotes_read'), true],
    ['Facturas comerciales', 'invoices', can('invoices_read'), true],
    ['Cuentas por cobrar / Reportes comerciales', 'accounts_receivable', can('reports_read'), true],
    ['Catálogo', 'catalog', can('catalog_read'), true],
    ['Referidos', 'referrals', can('affiliates_manage'), true],
    ['Integraciones', 'integrations', can('integrations_manage'), true],
    ['Usuarios y roles', 'roles_advanced', can('users_manage'), true],
    ['Ganadero Pro', 'ganadero_module', can('milk_read'), isDairyBusiness()]
  ];
  return rows.map(([label, feature, roleAllowed, businessAllowed]) => {
    const featureAllowed = canUseFeature(feature);
    const ok = Boolean(roleAllowed && featureAllowed && businessAllowed);
    const detail = !businessAllowed ? 'No aplica para este tipo de negocio' : `feature=${featureAllowed ? 'sí' : 'no'} · rol=${roleAllowed ? 'sí' : 'no'}`;
    return diagnosticRow(label, diagnosticBadge(ok, !businessAllowed || !featureAllowed || !roleAllowed), detail);
  }).join('');
}

function helperDiagnosticRows() {
  const helpers = [
    'hasWritableSubscription',
    'normalizeQuote',
    'normalizeQuoteItem',
    'renderCommissionsTable',
    'renderCommercialReports',
    'renderMilkControl',
    'renderDashboard',
    'createPublicQuoteLink',
    'copyPublicLink',
    'openPublicLink',
    'getEffectivePlanKey',
    'canOperateGanadero'
  ];
  return helpers.map(name => diagnosticRow(name, diagnosticBadge(typeof window[name] === 'function' || typeof globalThis[name] === 'function' || eval(`typeof ${name}`) === 'function'), 'helper requerido por módulos recientes')).join('');
}

function buildDiagnosticSummary() {
  const plan = getEffectivePlan();
  const usage = getPlanUsage();
  const diagnostics = {
    generated_at: new Date().toISOString(),
    mode,
    route: getRoute(),
    company_id: state.company?.id || null,
    company_name: state.company?.name || null,
    business_type: state.company?.business_type || null,
    role: getEffectiveRoleKey(),
    plan_key: getEffectivePlanKey(),
    plan_name: plan.name,
    subscription_status: normalizeSubscriptionStatus(getRawBillingStatus()),
    writable: hasWritableSubscription(),
    clients: (state.clients || []).length,
    quotes: (state.quotes || []).length,
    invoices: (state.invoices || []).length,
    milk_records: (state.milkRecords || []).length,
    usage: Object.fromEntries(Object.entries(usage.resources || {}).map(([key, value]) => [key, { used: value.used, limit: Number.isFinite(value.limit) ? value.limit : 'ilimitado' }]))
  };
  return JSON.stringify(diagnostics, null, 2);
}

async function copyDiagnosticSummary() {
  const text = buildDiagnosticSummary();
  try {
    await navigator.clipboard.writeText(text);
    toast('Diagnóstico copiado.');
  } catch (_error) {
    console.log(text);
    toast('No se pudo copiar. Revisa la consola.');
  }
}



async function callPlatformAdminUsers(action, payload = {}) {
  if (mode !== 'supabase' || !supabaseClient) throw new Error('Administración Auth requiere Supabase.');
  const { data, error } = await supabaseClient.functions.invoke('platform-admin-users', {
    body: { action, ...payload }
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data || {};
}

async function lookupDiagnosticUser(form) {
  if (!requirePermission('users_manage')) return;
  const email = normalizeEmail(new FormData(form).get('email'));
  state.diagnosticTargetEmail = email;
  state.diagnosticTargetRows = [];
  state.diagnosticAuthUser = null;
  state.diagnosticTargetMemberId = '';
  if (!email) { render(); return; }
  if (mode === 'supabase') {
    try {
      const result = await callPlatformAdminUsers('lookup', { email });
      state.diagnosticTargetRows = result.rows || [];
      state.diagnosticAuthUser = result.auth_user || null;
      state.diagnosticTargetMemberId = state.diagnosticTargetRows[0]?.member_id || state.diagnosticTargetRows[0]?.id || '';
    } catch (edgeError) {
      console.warn('Edge Function platform-admin-users no disponible, usando RPC global:', edgeError.message || edgeError);
      try {
        const { data, error } = await supabaseClient.rpc('platform_lookup_user_access', { lookup_email: email });
        if (error) throw error;
        state.diagnosticTargetRows = data || [];
        state.diagnosticTargetMemberId = state.diagnosticTargetRows[0]?.member_id || state.diagnosticTargetRows[0]?.id || '';
        toast('Para buscar usuarios Auth sin empresa despliega la Edge Function platform-admin-users.');
      } catch (error) {
        console.warn('Búsqueda global no disponible, usando Roles actuales:', error.message || error);
        const localRows = (state.teamMembers || []).filter(member => normalizeEmail(member.email) === email);
        state.diagnosticTargetRows = localRows.map(member => ({ ...member, member_id: member.id, company_name: state.company?.name, company_plan: state.company?.plan, subscription_status: getRawBillingStatus() }));
        toast('Ejecuta schema_phase10q_global_license_access.sql o despliega platform-admin-users.');
      }
    }
  } else {
    const localRows = (state.teamMembers || []).filter(member => normalizeEmail(member.email) === email);
    state.diagnosticTargetRows = localRows.map(member => ({ ...member, member_id: member.id, company_name: state.company?.name, company_plan: state.company?.plan, subscription_status: getRawBillingStatus() }));
  }
  render();
}


function diagnosticTargetMember() {
  const rows = state.diagnosticTargetRows || [];
  const selectedId = state.diagnosticTargetMemberId || (rows[0]?.member_id || rows[0]?.id || '');
  const row = rows.find(item => String(item.member_id || item.id) === String(selectedId)) || rows[0] || null;
  return row ? { ...row, id: row.member_id || row.id } : null;
}


function rolePermissionsForMember(member) {
  let roleKey = normalizeRole(member?.role || 'lector');
  if (roleKey === 'superuser' && !isPlatformSuperuserEmail(member?.email)) roleKey = 'admin';
  const role = ROLE_DEFINITIONS[roleKey] || ROLE_DEFINITIONS.lector;
  const all = allPermissionKeys();
  const base = role.permissions.includes('*') ? new Set(all) : new Set(role.permissions || []);
  const overrides = normalizeAccessOverride(member?.permission_overrides);
  overrides.deny.forEach(key => base.delete(key));
  overrides.allow.forEach(key => base.add(key));
  if (!isPlatformSuperuserEmail(member?.email)) base.delete('users_manage');
  return base;
}

function featuresForMember(member) {
  const base = planFeatureSet(getEffectivePlanKey());
  const set = new Set(base);
  const overrides = normalizeAccessOverride(member?.feature_overrides);
  overrides.deny.forEach(key => set.delete(key));
  overrides.allow.forEach(key => set.add(key));
  return set;
}

function accessOverrideSelect(name, current = 'inherit') {
  return `<select name="${escapeHtml(name)}" class="compact-select">
    <option value="inherit" ${current === 'inherit' ? 'selected' : ''}>Heredar</option>
    <option value="allow" ${current === 'allow' ? 'selected' : ''}>Activar</option>
    <option value="deny" ${current === 'deny' ? 'selected' : ''}>Desactivar</option>
  </select>`;
}

function globalDiagnosticRows() {
  return state.diagnosticTargetRows || [];
}

function globalOverrideValue(row, kind, key) {
  const source = kind === 'permission' ? row?.permission_overrides : kind === 'feature' ? row?.feature_overrides : row?.page_overrides;
  const overrides = normalizeAccessOverride(source);
  if (overrides.deny.includes(key)) return 'deny';
  if (overrides.allow.includes(key)) return 'allow';
  return 'inherit';
}

function renderDiagnosticUserPanel() {
  const email = normalizeEmail(state.diagnosticTargetEmail || '');
  const rows = globalDiagnosticRows();
  const selectedId = state.diagnosticTargetMemberId || (rows[0]?.member_id || rows[0]?.id || '');
  const row = rows.find(item => String(item.member_id || item.id) === String(selectedId)) || rows[0] || null;
  const isAuthOnly = Boolean(row?.auth_only || String(row?.member_id || row?.id || '').startsWith('auth:'));
  const authUser = state.diagnosticAuthUser || (row?.auth_user_id ? { id: row.auth_user_id, email: row.email, banned_until: row.status === 'inactive' ? 'inactive' : null } : null);
  const permissionKeys = allPermissionKeys();
  const featureKeys = Object.keys(FEATURE_DEFINITIONS).sort();
  const pageKeys = allPageKeys();
  const isProtected = email && isPlatformSuperuserEmail(email);
  const permissions = row ? rolePermissionsForMember({ ...row, id: row.member_id || row.id }) : new Set();
  const features = row ? featuresForMember({ ...row, id: row.member_id || row.id }) : new Set();
  return `
    <section class="card" style="margin-top:18px;">
      <h2>Diagnóstico global por usuario</h2>
      <p class="help">Introduce cualquier correo registrado en Supabase Auth o en cualquier empresa/licencia. Solo ${escapeHtml(PLATFORM_SUPERUSER_EMAIL)} puede buscar, activar, desactivar y limitar pantallas, módulos, permisos, roles y planes/pagos.</p>
      <form data-form="diagnostic-user-lookup" class="inline-form">
        <input name="email" type="email" value="${escapeHtml(email)}" placeholder="usuario@empresa.com" required />
        <button class="btn primary" type="submit">Buscar globalmente</button>
      </form>
      ${email && !rows.length ? `<div class="notice warning" style="margin-top:14px;">No se encontró ${escapeHtml(email)}. Si el correo existe en Supabase Auth, verifica que la Edge Function <code>platform-admin-users</code> esté desplegada.</div>` : ''}
      ${rows.length ? `
        <section class="grid cols-4" style="margin-top:18px;">
          <div class="stat-card"><span>Correo</span><strong>${escapeHtml(email)}</strong><small>${isAuthOnly ? 'Cuenta Auth sin empresa asignada' : `${rows.length} empresa${rows.length === 1 ? '' : 's'} asociada${rows.length === 1 ? '' : 's'}`}</small></div>
          <div class="stat-card"><span>Empresa seleccionada</span><strong>${escapeHtml(row?.company_name || 'Sin empresa')}</strong><small>${escapeHtml(row?.company_id || '')}</small></div>
          <div class="stat-card"><span>Rol</span><strong>${escapeHtml(roleLabel(row?.role))}</strong><small>${escapeHtml(row?.status || 'active')}</small></div>
          <div class="stat-card"><span>Plan</span><strong>${escapeHtml(PLAN_CATALOG[normalizePlanKey(row?.plan_id || row?.company_plan || 'demo')]?.name || 'Demo')}</strong><small>${escapeHtml(row?.subscription_status || row?.company_subscription_status || 'trial')}</small></div>
        </section>
        <form data-form="diagnostic-user-access" style="margin-top:18px;">
          <input type="hidden" name="email" value="${escapeHtml(email)}" />
          <div class="field" style="max-width:620px;">
            <label>Empresa / licencia o cuenta Auth seleccionada</label>
            <select name="member_id" ${isProtected ? 'disabled' : ''}>
              ${rows.map(item => {
                const id = item.member_id || item.id;
                return `<option value="${escapeHtml(id)}" ${String(id) === String(row?.member_id || row?.id) ? 'selected' : ''}>${escapeHtml(item.company_name || item.company_id || 'Cuenta Auth')} · ${item.auth_only ? 'Sin membresía' : escapeHtml(roleLabel(item.role))} · ${escapeHtml(item.status || 'active')}</option>`;
              }).join('')}
            </select>
            <p class="help">La edición se aplica a la membresía seleccionada. Si es una cuenta Auth sin empresa, se guardan restricciones globales por correo para licenciamiento futuro.</p>
          </div>
          ${isProtected ? `<div class="notice info">El Superusuario principal no puede ser degradado, eliminado, desactivado ni limitado desde esta pantalla.</div>` : `
            <section class="grid cols-3" style="margin-top:18px;">
              <div class="field"><label>Rol</label><select name="role" ${isAuthOnly ? 'disabled' : ''}>${roleOptions(row?.role || 'ventas')}</select>${isAuthOnly ? '<p class="help">Sin membresía asignada. El rol se define al agregarlo a una empresa/licencia.</p>' : ''}</div>
              <div class="field"><label>Estado</label><select name="status"><option value="active" ${String(row?.status || 'active') === 'active' ? 'selected' : ''}>Activo</option><option value="inactive" ${String(row?.status || 'active') !== 'active' ? 'selected' : ''}>Inactivo</option></select></div>
              <div class="field"><label>Acceso rápido</label><select name="quick_mode"><option value="custom">Personalizado</option><option value="enable_all">Activar todo</option><option value="disable_all">Desactivar todo</option><option value="read_only">Solo lectura</option></select></div>
            </section>
            <div class="grid cols-3" style="margin-top:18px;">
              <div class="card soft-card">
                <h3>Pantallas del sistema</h3>
                <p class="help">Controla si el usuario puede ver Dashboard, Seguimiento, Clientes, Cotizaciones, Planes y pagos, Diagnóstico, etc.</p>
                <div class="table-wrap compact-table"><table><thead><tr><th>Pantalla</th><th>Override</th></tr></thead><tbody>
                  ${pageKeys.map(key => `<tr><td>${escapeHtml(pageLabel(key))}<br><code>${escapeHtml(key)}</code></td><td>${accessOverrideSelect('page:' + key, globalOverrideValue(row, 'page', key))}</td></tr>`).join('')}
                </tbody></table></div>
              </div>
              <div class="card soft-card">
                <h3>Módulos / feature flags</h3>
                <div class="table-wrap compact-table"><table><thead><tr><th>Módulo</th><th>Estado efectivo</th><th>Override</th></tr></thead><tbody>
                  ${featureKeys.map(key => `<tr><td>${escapeHtml(FEATURE_DEFINITIONS[key]?.label || key)}<br><code>${escapeHtml(key)}</code></td><td>${features.has(key) ? '<span class="badge success">Activo</span>' : '<span class="badge locked">Inactivo</span>'}</td><td>${accessOverrideSelect('feature:' + key, globalOverrideValue(row, 'feature', key))}</td></tr>`).join('')}
                </tbody></table></div>
              </div>
              <div class="card soft-card">
                <h3>Permisos operativos</h3>
                <div class="table-wrap compact-table"><table><thead><tr><th>Permiso</th><th>Estado efectivo</th><th>Override</th></tr></thead><tbody>
                  ${permissionKeys.map(key => `<tr><td><code>${escapeHtml(key)}</code></td><td>${permissions.has(key) ? '<span class="badge success">Activo</span>' : '<span class="badge locked">Inactivo</span>'}</td><td>${accessOverrideSelect('perm:' + key, globalOverrideValue(row, 'permission', key))}</td></tr>`).join('')}
                </tbody></table></div>
              </div>
            </div>
            <div class="form-actions" style="margin-top:14px;">
              <button class="btn primary" type="submit">Guardar acceso global</button>
              <button class="btn warning" type="button" data-action="deactivate-global-user" data-id="${escapeHtml(row?.member_id || row?.id || '')}">Desactivar esta membresía</button>
              <button class="btn secondary" type="button" data-action="activate-global-user" data-id="${escapeHtml(row?.member_id || row?.id || '')}">Activar esta membresía</button>
              <button class="btn warning" type="button" data-action="disable-auth-user" data-email="${escapeHtml(email)}">Desactivar login Auth</button>
              <button class="btn secondary" type="button" data-action="enable-auth-user" data-email="${escapeHtml(email)}">Activar login Auth</button>
              <button class="btn ghost" type="button" data-action="send-auth-recovery" data-email="${escapeHtml(email)}">Enviar recuperación</button>
            </div>
          `}
        </form>
      ` : ''}
    </section>
  `;
}

async function saveDiagnosticUserAccess(form) {
  if (!requirePermission('users_manage')) return;
  const fd = new FormData(form);
  const email = normalizeEmail(fd.get('email'));
  const memberId = String(fd.get('member_id') || state.diagnosticTargetMemberId || '');
  const row = (state.diagnosticTargetRows || []).find(item => String(item.member_id || item.id) === memberId);
  if (!row) { toast('Membresía no encontrada.'); return; }
  if (isPlatformSuperuserEmail(email)) { toast('El Superusuario principal no puede ser limitado.'); return; }

  const permissionOverrides = { allow: [], deny: [] };
  const featureOverrides = { allow: [], deny: [] };
  const pageOverrides = { allow: [], deny: [] };
  for (const [key, value] of fd.entries()) {
    if (key.startsWith('perm:') && ['allow','deny'].includes(String(value))) permissionOverrides[String(value)].push(key.slice(5));
    if (key.startsWith('feature:') && ['allow','deny'].includes(String(value))) featureOverrides[String(value)].push(key.slice(8));
    if (key.startsWith('page:') && ['allow','deny'].includes(String(value))) pageOverrides[String(value)].push(key.slice(5));
  }

  const quickMode = String(fd.get('quick_mode') || 'custom');
  if (quickMode === 'enable_all') {
    pageOverrides.allow = allPageKeys(); pageOverrides.deny = [];
    featureOverrides.allow = Object.keys(FEATURE_DEFINITIONS); featureOverrides.deny = [];
    permissionOverrides.allow = allPermissionKeys(); permissionOverrides.deny = [];
  }
  if (quickMode === 'disable_all') {
    pageOverrides.deny = allPageKeys(); pageOverrides.allow = [];
    featureOverrides.deny = Object.keys(FEATURE_DEFINITIONS); featureOverrides.allow = [];
    permissionOverrides.deny = allPermissionKeys(); permissionOverrides.allow = [];
  }
  if (quickMode === 'read_only') {
    const writePerms = allPermissionKeys().filter(key => /_write|_delete|_void|_payments|manage|settings|billing/.test(key));
    permissionOverrides.deny = [...new Set([...permissionOverrides.deny, ...writePerms])];
    pageOverrides.allow = [...new Set([...pageOverrides.allow, 'dashboard','reports','commercial_reports','quotes','invoices','clients','catalog'])];
  }

  const role = normalizeRole(fd.get('role') || row.role || 'lector');
  const status = ['active','inactive'].includes(String(fd.get('status') || 'active')) ? String(fd.get('status') || 'active') : 'active';
  const patch = { role: role === 'superuser' ? 'admin' : role, status, permission_overrides: permissionOverrides, feature_overrides: featureOverrides, page_overrides: pageOverrides, updated_at: new Date().toISOString() };

  if (mode === 'supabase') {
    const isAuthOnly = Boolean(row.auth_only || memberId.startsWith('auth:'));
    if (isAuthOnly) {
      const result = await callPlatformAdminUsers('update-global-access', { email, patch });
      state.diagnosticTargetRows = result.rows || [];
      state.diagnosticAuthUser = result.auth_user || null;
    } else {
      const { error } = await supabaseClient.rpc('platform_update_user_access', { target_member_id: memberId, patch });
      if (error) throw error;
      const refreshedResult = await callPlatformAdminUsers('lookup', { email }).catch(async () => {
        const { data, error: refreshError } = await supabaseClient.rpc('platform_lookup_user_access', { lookup_email: email });
        if (refreshError) throw refreshError;
        return { rows: data || [], auth_user: null };
      });
      state.diagnosticTargetRows = refreshedResult.rows || [];
      state.diagnosticAuthUser = refreshedResult.auth_user || null;
    }
  } else {
    const member = (state.teamMembers || []).find(item => String(item.id) === memberId);
    if (member) Object.assign(member, patch);
    saveLocalState();
    state.diagnosticTargetRows = (state.teamMembers || []).filter(item => normalizeEmail(item.email) === email).map(member => ({ ...member, member_id: member.id, company_name: state.company?.name }));
  }
  if (email === normalizeEmail(state.session?.email)) await loadPlatformOverride();
  state.diagnosticTargetEmail = email;
  state.diagnosticTargetMemberId = memberId;
  toast('Acceso global actualizado.');
  render();
}

async function setGlobalUserStatus(memberId, status) {
  if (!requirePermission('users_manage')) return;
  const row = (state.diagnosticTargetRows || []).find(item => String(item.member_id || item.id) === String(memberId));
  if (!row) return;
  if (isPlatformSuperuserEmail(row.email)) { toast('No puedes modificar el Superusuario principal.'); return; }
  if (mode === 'supabase') {
    const email = normalizeEmail(row.email || state.diagnosticTargetEmail);
    if (String(memberId).startsWith('auth:') || row.auth_only) {
      const result = await callPlatformAdminUsers('update-global-access', { email, patch: { status, updated_at: new Date().toISOString() } });
      state.diagnosticTargetRows = result.rows || [];
      state.diagnosticAuthUser = result.auth_user || null;
    } else {
      const { error } = await supabaseClient.rpc('platform_update_user_access', { target_member_id: String(memberId), patch: { status, updated_at: new Date().toISOString() } });
      if (error) throw error;
      const refreshedResult = await callPlatformAdminUsers('lookup', { email }).catch(async () => {
        const { data, error: refreshError } = await supabaseClient.rpc('platform_lookup_user_access', { lookup_email: email });
        if (refreshError) throw refreshError;
        return { rows: data || [], auth_user: null };
      });
      state.diagnosticTargetRows = refreshedResult.rows || [];
      state.diagnosticAuthUser = refreshedResult.auth_user || null;
    }
    state.diagnosticTargetEmail = email;
  } else {
    const member = (state.teamMembers || []).find(item => String(item.id) === String(memberId));
    if (member) member.status = status;
    saveLocalState();
  }
  toast(status === 'active' ? 'Usuario activado.' : 'Usuario desactivado.');
  render();
}



async function setAuthUserLoginStatus(email, enabled) {
  if (!requirePermission('users_manage')) return;
  const targetEmail = normalizeEmail(email || state.diagnosticTargetEmail);
  if (!targetEmail) { toast('Correo requerido.'); return; }
  if (isPlatformSuperuserEmail(targetEmail)) { toast('No puedes modificar el Superusuario principal.'); return; }
  if (mode !== 'supabase') { toast('Esta acción requiere Supabase Auth.'); return; }
  const result = await callPlatformAdminUsers(enabled ? 'enable-auth-user' : 'disable-auth-user', { email: targetEmail });
  state.diagnosticTargetEmail = targetEmail;
  state.diagnosticTargetRows = result.rows || [];
  state.diagnosticAuthUser = result.auth_user || null;
  state.diagnosticTargetMemberId = state.diagnosticTargetRows[0]?.member_id || state.diagnosticTargetRows[0]?.id || '';
  toast(enabled ? 'Login Auth activado.' : 'Login Auth desactivado.');
  render();
}

async function sendAuthRecoveryFromDiagnostics(email) {
  if (!requirePermission('users_manage')) return;
  const targetEmail = normalizeEmail(email || state.diagnosticTargetEmail);
  if (!targetEmail) { toast('Correo requerido.'); return; }
  if (mode !== 'supabase') { toast('Esta acción requiere Supabase Auth.'); return; }
  const redirectTo = `${location.origin}${location.pathname}`;
  await callPlatformAdminUsers('send-recovery', { email: targetEmail, redirect_to: redirectTo });
  toast('Solicitud de recuperación enviada/generada desde Supabase Auth.');
}

function renderDiagnostics() {
  const plan = getEffectivePlan();
  const status = normalizeSubscriptionStatus(getRawBillingStatus());
  const usage = getPlanUsage();
  const writable = hasWritableSubscription();
  const requiredSql = [
    'schema_phase10a_saas_plans.sql',
    'schema_phase10b_superuser_roles.sql',
    'schema_phase10c_internal_guards.sql',
    'schema_phase10e_demo_limits.sql',
    'schema_phase10f_commercial_fiscal_boundary.sql',
    'schema_phase10g_ganadero_premium.sql',
    'schema_phase10hi_billing_subscription_status.sql',
    'schema_phase10m_referrals_affiliates.sql',
    'schema_phase10n_secure_public_links.sql',
    'schema_phase10r_auth_admin_global.sql'
  ];
  return `
    <div class="page-header">
      <div>
        <h1>Diagnóstico del sistema</h1>
        <p>Revisión interna de sesión, plan, rol, módulos críticos y configuración técnica. Visible solo para Superusuario.</p>
      </div>
      <div class="header-actions">
        <button class="btn secondary" data-action="copy-diagnostic-summary">Copiar diagnóstico</button>
        <button class="btn secondary" data-route="billing">Planes y pagos</button>
      </div>
    </div>
    ${renderConfigNav('diagnostics')}

    <section class="grid cols-4" style="margin-top:18px;">
      <div class="stat-card"><span>Modo</span><strong>${escapeHtml(mode)}</strong><small>${mode === 'supabase' ? 'Conectado a Supabase' : 'Demo local'}</small></div>
      <div class="stat-card"><span>Rol</span><strong>${escapeHtml(roleLabel(getEffectiveRoleKey()))}</strong><small>${escapeHtml(getEffectiveRoleKey())}</small></div>
      <div class="stat-card"><span>Plan efectivo</span><strong>${escapeHtml(plan.name)}</strong><small>${escapeHtml(getEffectivePlanKey())}</small></div>
      <div class="stat-card"><span>Estado</span><strong>${escapeHtml(status)}</strong><small>${writable ? 'Escritura permitida' : 'Solo lectura'}</small></div>
    </section>

    <section class="grid cols-2" style="margin-top:18px;">
      <div class="card">
        <h2>Salud general</h2>
        <div class="table-wrap"><table><thead><tr><th>Chequeo</th><th>Estado</th><th>Detalle</th></tr></thead><tbody>
          ${diagnosticRow('Sesión', diagnosticBadge(Boolean(state.session || mode === 'local')), state.session?.email || 'Demo local')}
          ${diagnosticRow('Empresa activa', diagnosticBadge(Boolean(state.company?.id || mode === 'local')), state.company?.name || 'Empresa local')}
          ${diagnosticRow('Suscripción operativa', diagnosticBadge(writable, status === 'past_due'), subscriptionStatusNotice() || 'Sin bloqueo de escritura')}
          ${diagnosticRow('Tipo Asociación Ganaderos', diagnosticBadge(isDairyBusiness(), true), isDairyBusiness() ? 'Módulo vertical aplicable' : 'No aplica')}
          ${diagnosticRow('Ganadero habilitado', diagnosticBadge(canOperateGanadero(), isDairyBusiness()), canOperateGanadero() ? 'Plan y rol correctos' : 'Requiere Ganadero Pro/CRM Empresa, tipo de negocio y rol')}
          ${diagnosticRow('Supabase URL', diagnosticBadge(Boolean(config.supabaseUrl), mode === 'local'), config.supabaseUrl || 'No configurado')}
          ${diagnosticRow('Publishable key', diagnosticBadge(Boolean(config.supabaseAnonKey), mode === 'local'), config.supabaseAnonKey ? 'Configurada en frontend' : 'No configurada')}
        </tbody></table></div>
      </div>
      <div class="card">
        <h2>Uso contra límites</h2>
        <div class="usage-list">
          ${Object.entries(usage.resources).map(([key, resource]) => `
            <div class="usage-item">
              <div><strong>${escapeHtml(resource.label)}</strong><span>${resource.used} / ${Number.isFinite(resource.limit) ? resource.limit : 'Ilimitado'}</span></div>
              <div class="progress"><span style="width:${Number.isFinite(resource.limit) ? resource.percent : 0}%"></span></div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <section class="card" style="margin-top:18px;">
      <h2>Acceso por módulo</h2>
      <div class="table-wrap"><table><thead><tr><th>Módulo</th><th>Estado</th><th>Detalle</th></tr></thead><tbody>${moduleDiagnosticRows()}</tbody></table></div>
    </section>

    ${renderDiagnosticUserPanel()}

    <section class="card" style="margin-top:18px;">
      <h2>Helpers críticos de interfaz</h2>
      <p class="help">Estos chequeos reducen errores tipo “función no definida” antes de seguir agregando módulos.</p>
      <div class="table-wrap"><table><thead><tr><th>Función</th><th>Estado</th><th>Uso</th></tr></thead><tbody>${helperDiagnosticRows()}</tbody></table></div>
    </section>

    <section class="grid cols-2" style="margin-top:18px;">
      <div class="card">
        <h2>SQL esperado</h2>
        <p class="help">Lista de scripts incrementales que deberían estar aplicados según las fases actuales.</p>
        <ul class="check-list">${requiredSql.map(file => `<li>${escapeHtml(file)}</li>`).join('')}</ul>
      </div>
      <div class="card">
        <h2>Backend seguro</h2>
        <div class="table-wrap"><table><tbody>
          ${diagnosticRow('Links públicos', diagnosticBadge(typeof createPublicQuoteLink === 'function'), 'Cotizaciones públicas por token')}
          ${diagnosticRow('Vista pública', diagnosticBadge(true), 'public.html?t=TOKEN')}
          ${diagnosticRow('Edge Functions', diagnosticBadge(Boolean(config.supabaseUrl), true), 'create-public-quote-link, get-public-quote, quote-public-action, platform-admin-users')}
        </tbody></table></div>
      </div>
    </section>
  `;
}

function renderBilling() {
  const usage = getPlanUsage();
  const provider = config.billingProvider || 'manual / lemon_squeezy';
  const snapshot = getBillingSnapshot();
  return `
    <div class="page-header">
      <div>
        <h1>Planes y pagos</h1>
        <p>Plan actual, límites, estado de suscripción, pagos manuales y actualización comercial.</p>
      </div>
      <div class="header-actions"><button class="btn secondary" data-route="settings">${escapeHtml(t('back'))}</button></div>
    </div>

    ${renderConfigNav('billing')}

    <div style="margin-top:18px;">${renderBillingHealthCard()}</div>
    <div style="margin-top:18px;">${renderUsageCard()}</div>
    ${renderDemoLimitCard()}
    ${renderModuleAccessGrid()}

    <section class="grid cols-4" style="margin-top:18px;">
      ${['crm_basico','crm_pro','ganadero_pro','crm_empresa'].map(planKey => renderPlanCard(planKey, usage.planKey, provider)).join('')}
    </section>

    <section class="card" style="margin-top:18px;">
      <h2>Resumen de cobro</h2>
      <div class="billing-mini-grid">
        <div><span>Plan efectivo</span><strong>${escapeHtml(usage.plan.name)}</strong></div>
        <div><span>Estado</span><strong>${escapeHtml(subscriptionStatusLabel(snapshot.status))}</strong></div>
        <div><span>Método manual</span><strong>${escapeHtml(snapshot.manualPaymentMethod || 'Pendiente')}</strong></div>
        <div><span>Último pago</span><strong>${escapeHtml(snapshot.lastPaymentStatus || 'Sin registrar')}</strong></div>
      </div>
      <div class="notice">Este módulo muestra y controla facturas comerciales internas. NCF/e-CF fiscal se implementará después con backend seguro.</div>
      <p class="help">Cuando se active Lemon Squeezy o Paddle, estos campos podrán alimentarse por webhook. Hasta entonces, el Superusuario puede administrar el plan manualmente.</p>
    </section>

    ${renderBillingAdminForm()}
    ${renderSubscriptionRulesCard()}
    ${can('users_manage') ? renderPlanQaAccessCard() : ''}

    <section class="card" style="margin-top:18px;">
      <h2>Setup e implementación</h2>
      <div class="bullets">
        <span>Setup básico desde RD$5,000.</span>
        <span>Setup Pro desde RD$12,000.</span>
        <span>Implementación ganadera desde RD$25,000.</span>
        <span>Personalizaciones por paquete cerrado o RD$1,500 a RD$3,500/hora.</span>
      </div>
      <div class="actions" style="margin-top:14px;">
        <a class="btn primary" href="${escapeHtml(salesContactUrl(snapshot.planKey))}" target="_blank" rel="noopener">Contactar ventas</a>
        <button class="btn secondary" data-route="dashboard">Volver al Dashboard</button>
      </div>
    </section>
  `;
}

function renderPlanCard(planKey, currentPlanKey, provider) {
  const plan = PLAN_CATALOG[planKey];
  const isCurrent = planKey === currentPlanKey;
  const features = (plan.features || []).slice(0, 7).map(key => FEATURE_DEFINITIONS[key]?.label || key);
  return `
    <div class="card plan-card ${isCurrent ? 'current' : ''}">
      <div class="plan-topline">${isCurrent ? 'Plan actual' : escapeHtml(provider)}</div>
      <h2>${escapeHtml(plan.name)}</h2>
      <div class="plan-price">${escapeHtml(plan.priceLabel || (plan.price === null ? 'Personalizado' : `RD$${numberFmt(plan.price, 0)}`))}<span>${plan.price === null ? '' : '/mes'}</span></div>
      <p>${escapeHtml(plan.description)}</p>
      <div class="bullets">
        <span>${formatLimit(normalizeFiniteLimit(plan.maxClients))} clientes.</span>
        <span>${formatLimit(normalizeFiniteLimit(plan.maxQuotesPerMonth ?? plan.quoteLimit))} cotizaciones al mes.</span>
        <span>${formatLimit(normalizeFiniteLimit(plan.maxInvoicesPerMonth))} facturas comerciales al mes.</span>
        <span>${plan.users} usuario${plan.users > 1 ? 's' : ''} incluido${plan.users > 1 ? 's' : ''}.</span>
        <span>${escapeHtml(plan.setupLabel || '')}</span>
      </div>
      <details class="plan-features"><summary>Funciones incluidas</summary><p>${features.map(escapeHtml).join(' · ')}</p></details>
      <button class="btn ${isCurrent ? 'secondary' : 'primary'} full" data-action="checkout" data-plan="${planKey}" ${isCurrent ? 'disabled' : ''}>
        ${isCurrent ? 'Activo' : plan.price === null ? 'Solicitar propuesta' : 'Actualizar plan'}
      </button>
      ${isCurrent ? '' : `<a class="btn ghost full" href="${escapeHtml(salesContactUrl(planKey))}" target="_blank" rel="noopener">Consultar implementación</a>`}
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
  const minimum = Number(affiliate?.payout_minimum || 25);
  const rate = Number(affiliate?.commission_rate || 0.2);
  const months = Number(affiliate?.commission_months || 12);
  const partnerType = affiliate?.partner_type || affiliate?.type || (rate >= 0.3 ? 'partner' : 'standard');

  return `
    <div class="page-header">
      <div>
        <h1>Referidos</h1>
        <p>Programa comercial: 20% recurrente por 12 meses. Partners aprobados pueden recibir 30%.</p>
      </div>
      <div class="header-actions"><button class="btn secondary" data-route="settings">${escapeHtml(t('back'))}</button></div>
    </div>

    ${renderConfigNav('affiliates')}

    <div style="margin-top:18px;"></div>

    ${affiliate ? `
      <section class="grid cols-4">
        <div class="card metric"><span>Referidos</span><strong>${state.referrals.length}</strong></div>
        <div class="card metric"><span>Pendiente</span><strong>${money(pending)}</strong></div>
        <div class="card metric"><span>Disponible</span><strong>${money(available)}</strong></div>
        <div class="card metric"><span>Pagado</span><strong>${money(paid)}</strong></div>
      </section>

      <section class="card" style="margin-top:18px;">
        <div class="section-title-row">
          <div>
            <h2>Tu link de referido</h2>
            <p class="help">Comparte este link. Cuando una empresa se registra desde él, queda asociada a tu código.</p>
          </div>
          <span class="badge ${affiliate.status === 'approved' || affiliate.status === 'active' ? 'success' : ''}">${escapeHtml(affiliateStatusLabel(affiliate.status))}</span>
        </div>
        <div class="copy-line"><input readonly value="${escapeHtml(link)}" /><button class="btn secondary" data-action="copy-affiliate-link">Copiar</button></div>
        <div class="billing-mini-grid" style="margin-top:14px;">
          <div><span>Código</span><strong>${escapeHtml(affiliate.code)}</strong></div>
          <div><span>Tipo</span><strong>${partnerType === 'partner' ? 'Partner' : 'Afiliado estándar'}</strong></div>
          <div><span>Comisión</span><strong>${(rate * 100).toFixed(0)}%</strong></div>
          <div><span>Duración</span><strong>${months} meses</strong></div>
        </div>
        <p class="help">La comisión se genera solo cuando el cliente paga. Si hay reembolso, se cancela. Se libera después de 30 días. Pago mínimo sugerido: ${money(minimum)}.</p>
      </section>

      <section class="grid cols-2" style="margin-top:18px;">
        <div class="card">
          <h2>Reglas del programa</h2>
          <div class="bullets">
            <span>Afiliado estándar: 20% recurrente por 12 meses.</span>
            <span>Partner aprobado: 30% recurrente por 12 meses.</span>
            <span>No hay comisión sobre pruebas gratis.</span>
            <span>Los payouts siguen manuales en el MVP.</span>
          </div>
        </div>
        <div class="card">
          <h2>Estado de payout</h2>
          <p>Disponible para solicitar: <strong>${money(available)}</strong></p>
          <p class="help">Mínimo de pago: ${money(minimum)}. Si todavía no llega al mínimo, se acumula para el próximo corte.</p>
          <a class="btn ${available >= minimum ? 'primary' : 'secondary'}" href="${escapeHtml(salesContactUrl('referrals'))}" target="_blank" rel="noopener">Solicitar revisión de payout</a>
        </div>
      </section>

      <section class="card" style="margin-top:18px;">
        <h2>Referidos registrados</h2>
        ${state.referrals.length ? renderReferralsTable() : `<div class="empty">Todavía no hay empresas registradas con tu código.</div>`}
      </section>

      <section class="card" style="margin-top:18px;">
        <h2>Comisiones</h2>
        ${state.commissions.length ? renderCommissionsTable() : `<div class="empty">Todavía no hay comisiones generadas.</div>`}
      </section>
    ` : `
      <section class="card">
        <h2>Activar afiliado</h2>
        <form data-form="affiliate" class="form-grid two">
          <div class="field"><label>Código</label><input name="code" value="${escapeHtml(code)}" maxlength="24" required /></div>
          <div class="field"><label>Email de pago</label><input name="payout_email" type="email" placeholder="tu@email.com" /></div>
          <button class="btn primary" type="submit">Crear código de afiliado</button>
        </form>
        <p class="help">El código queda único. La comisión normal se crea en 20%; subir a Partner 30% se hace manualmente desde Supabase o desde el panel administrativo futuro.</p>
      </section>
    `}
  `;
}

function affiliateStatusLabel(status) {
  const labels = { active: 'Activo', approved: 'Aprobado', pending: 'Pendiente', suspended: 'Suspendido', rejected: 'Rechazado' };
  return labels[status] || 'Activo';
}

function referralStatusLabel(status) {
  const labels = { lead: 'Lead', trial: 'Prueba', active: 'Cliente activo', paid: 'Cliente pago', cancelled: 'Cancelado', refunded: 'Reembolsado' };
  return labels[status] || status || 'Registrado';
}

function renderReferralsTable() {
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Fecha</th><th>Empresa referida</th><th>Estado</th><th>Plan</th><th>Conversión</th></tr></thead>
        <tbody>
          ${state.referrals.map(r => `
            <tr>
              <td>${escapeHtml((r.created_at || '').slice(0, 10))}</td>
              <td>${escapeHtml(r.referred_company_name || r.company_name || r.referred_email || r.referred_company_id || 'Empresa registrada')}</td>
              <td><span class="badge">${escapeHtml(referralStatusLabel(r.status))}</span></td>
              <td>${escapeHtml(r.plan_id || r.plan || 'Pendiente')}</td>
              <td>${escapeHtml((r.converted_at || r.first_payment_at || '').slice(0, 10) || 'Pendiente')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}


function commissionStatusLabel(status) {
  const labels = {
    pending: 'Pendiente',
    available: 'Disponible',
    approved: 'Aprobada',
    paid: 'Pagada',
    cancelled: 'Cancelada',
    refunded: 'Reembolsada'
  };
  return labels[status] || status || 'Pendiente';
}

function commissionStatusClass(status) {
  if (status === 'available' || status === 'approved' || status === 'paid') return 'success';
  if (status === 'cancelled' || status === 'refunded') return 'danger';
  return '';
}

function renderCommissionsTable() {
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Fecha</th><th>Referido</th><th>Periodo</th><th>Base</th><th>Comisión</th><th>Estado</th><th>Disponible</th></tr></thead>
        <tbody>
          ${state.commissions.map(c => `
            <tr>
              <td>${escapeHtml((c.created_at || c.commission_date || '').slice(0, 10) || 'Pendiente')}</td>
              <td>${escapeHtml(c.referred_company_name || c.company_name || c.referred_email || c.referral_id || 'Referido')}</td>
              <td>${escapeHtml(c.period_label || c.billing_period || c.month || 'Mensual')}</td>
              <td>${money(c.base_amount || c.invoice_amount || c.subscription_amount || 0)}</td>
              <td><strong>${money(c.amount || c.commission_amount || 0)}</strong></td>
              <td><span class="badge ${commissionStatusClass(c.status)}">${escapeHtml(commissionStatusLabel(c.status))}</span></td>
              <td>${escapeHtml((c.available_at || c.released_at || c.paid_at || '').slice(0, 10) || 'Pendiente')}</td>
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
  const email = normalizeEmail(formData.get('email'));
  const password = String(formData.get('password') || '');
  const name = String(formData.get('name') || '').trim();
  state.authMessage = '';

  if (!email || !password) {
    state.authMessage = 'Correo y contraseña son obligatorios.';
    render();
    return;
  }

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
      state.authMessage = state.activeAuthTab === 'register'
        ? 'Cuenta creada. Revisa tu correo si Supabase requiere confirmación antes de entrar.'
        : 'No se recibió sesión de Supabase. Revisa si el correo requiere confirmación.';
      render();
      return;
    }

    state.passwordRecovery = { active: false, email: '', mode: '' };
    state.session = normalizeSession(data.session.user);
    await loadRemoteData();
    setRoute('dashboard');
  } catch (error) {
    state.loading = false;
    state.authMessage = friendlyAuthError(error);
    render();
  }
}

async function handleForgotPassword(form) {
  if (mode !== 'supabase') {
    toast('Configura Supabase para usar recuperación de contraseña.');
    return;
  }
  const email = normalizeEmail(new FormData(form).get('email'));
  if (!email) {
    state.authMessage = 'Escribe el correo del usuario.';
    render();
    return;
  }
  try {
    state.authMessage = '';
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: recoveryRedirectUrl()
    });
    if (error) throw error;
    state.authMessage = 'Correo enviado. Si el usuario existe en Supabase Auth, recibirá instrucciones para recuperar el acceso. Si recibe un código temporal, puede pegarlo aquí junto a la nueva contraseña.';
    state.activeAuthTab = 'forgot';
    render();
  } catch (error) {
    state.authMessage = friendlyAuthError(error);
    render();
  }
}

async function handlePasswordResetCode(form) {
  if (mode !== 'supabase') {
    toast('Configura Supabase para usar recuperación de contraseña.');
    return;
  }
  const fd = new FormData(form);
  const email = normalizeEmail(fd.get('email'));
  const token = String(fd.get('token') || '').trim();
  const newPassword = String(fd.get('new_password') || '');
  const confirmPassword = String(fd.get('confirm_password') || '');

  if (!email || !token) {
    state.authMessage = 'Correo y código temporal son obligatorios.';
    render();
    return;
  }
  if (newPassword !== confirmPassword) {
    state.authMessage = 'Las contraseñas no coinciden.';
    render();
    return;
  }
  if (!isPasswordStrongEnough(newPassword)) {
    state.authMessage = 'La contraseña nueva debe tener al menos 8 caracteres.';
    render();
    return;
  }

  try {
    state.loading = true;
    render();
    const { data, error } = await supabaseClient.auth.verifyOtp({
      email,
      token,
      type: 'recovery'
    });
    if (error) throw error;
    const user = data?.user || data?.session?.user;
    if (user) state.session = normalizeSession(user);
    const { data: updated, error: updateError } = await supabaseClient.auth.updateUser({ password: newPassword });
    if (updateError) throw updateError;
    const currentUser = updated?.user || user || (await supabaseClient.auth.getUser()).data?.user;
    if (!currentUser) throw new Error('No se pudo validar el usuario después de cambiar la contraseña.');
    state.session = normalizeSession(currentUser);
    state.passwordRecovery = { active: false, email: '', mode: '' };
    state.activeAuthTab = 'login';
    await loadRemoteData();
    setRoute('dashboard');
    toast('Contraseña actualizada.');
  } catch (error) {
    state.loading = false;
    state.authMessage = friendlyAuthError(error);
    state.activeAuthTab = 'forgot';
    render();
  }
}

async function handleUpdatePassword(form) {
  if (mode !== 'supabase') {
    toast('Configura Supabase para usar recuperación de contraseña.');
    return;
  }
  const fd = new FormData(form);
  const newPassword = String(fd.get('new_password') || '');
  const confirmPassword = String(fd.get('confirm_password') || '');

  if (newPassword !== confirmPassword) {
    state.authMessage = 'Las contraseñas no coinciden.';
    render();
    return;
  }
  if (!isPasswordStrongEnough(newPassword)) {
    state.authMessage = 'La contraseña nueva debe tener al menos 8 caracteres.';
    render();
    return;
  }

  try {
    state.loading = true;
    render();
    const { data, error } = await supabaseClient.auth.updateUser({ password: newPassword });
    if (error) throw error;
    const currentUser = data?.user || (await supabaseClient.auth.getUser()).data?.user;
    if (!currentUser) throw new Error('No se pudo validar el usuario después de cambiar la contraseña.');
    state.session = normalizeSession(currentUser);
    state.passwordRecovery = { active: false, email: '', mode: '' };
    state.activeAuthTab = 'login';
    await loadRemoteData();
    setRoute('dashboard');
    toast('Contraseña actualizada.');
  } catch (error) {
    state.loading = false;
    state.authMessage = friendlyAuthError(error);
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
    invoice_prefix: String(fd.get('invoice_prefix') || getBusinessInvoiceProfile(nextBusinessType).prefix || 'F-').trim(),
    next_invoice_number: Math.max(1, Number(fd.get('next_invoice_number') || 1)),
    default_invoice_due_days: Math.max(0, Number(fd.get('default_invoice_due_days') || getBusinessInvoiceProfile(nextBusinessType).dueDays || 15)),
    default_invoice_notes: String(fd.get('default_invoice_notes') || '').trim(),
    default_invoice_terms: String(fd.get('default_invoice_terms') || '').trim(),
    invoice_document_label: String(fd.get('invoice_document_label') || 'Factura comercial interna').trim(),
    fiscal_integration_status: String(fd.get('fiscal_integration_status') || 'not_enabled').trim(),
    fiscal_provider: String(fd.get('fiscal_provider') || '').trim(),
    default_fiscal_receipt_type: String(fd.get('default_fiscal_receipt_type') || 'none').trim(),
    invoice_fiscal_mode: 'commercial_internal',
    logo_data_url: String(fd.get('logo_data_url') || '').trim(),
    logo_position: ['left','center','right'].includes(String(fd.get('logo_position') || 'right')) ? String(fd.get('logo_position') || 'right') : 'right'
  };

  saveDairySettingsFallback(dairyFields);

  if (mode === 'supabase') {
    const fullPayload = { ...payload, ...dairyFields };
    const fallbackCompanyPayload = { ...payload };
    ['invoice_prefix','next_invoice_number','default_invoice_due_days','default_invoice_notes','default_invoice_terms','invoice_document_label','fiscal_integration_status','fiscal_provider','default_fiscal_receipt_type','invoice_fiscal_mode','default_milk_price_per_liter','default_milk_commission_rate'].forEach(key => delete fallbackCompanyPayload[key]);
    let result = await supabaseClient
      .from('companies')
      .update(fullPayload)
      .eq('id', state.company.id)
      .select('*')
      .single();

    if (result.error) {
      const message = String(result.error.message || '').toLowerCase();
      if (message.includes('default_milk') || message.includes('invoice_') || message.includes('next_invoice') || message.includes('column')) {
        console.warn('Columnas nuevas de empresa pendientes. Ejecuta schema_phase8b y schema_phase9 para guardar todo en Supabase.');
        result = await supabaseClient
          .from('companies')
          .update(fallbackCompanyPayload)
          .eq('id', state.company.id)
          .select('*')
          .single();
      }
    }

    if (result.error) throw result.error;
    state.company = { ...normalizeCompany(result.data), ...payload, ...dairyFields, theme_preference: themePreference };
  } else {
    state.company = { ...state.company, ...payload, ...dairyFields, theme_preference: themePreference };
    saveLocalState();
  }
  toast('Empresa guardada.');
  render();
}

async function saveClient(form) {
  if (!guardAction('client_create')) return;
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
  if (!guardAction('client_delete')) return;
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
  const isEditingQuote = Boolean(form.dataset.id);
  if (!guardAction(isEditingQuote ? 'quote_update' : 'quote_create', { skipLimit: isEditingQuote })) return;
  const quote = collectQuoteForm(form);
  const existingQuote = quote.id ? state.quotes.find(q => q.id === quote.id) : null;
  if (!quote.items.length) {
    toast('Agrega al menos un item con descripción.');
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
  if (!guardAction('quote_delete')) return;
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
  if (!guardAction('catalog_create')) return;
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
  if (!guardAction('catalog_delete')) return;
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
  if (!guardAction('catalog_create')) return;
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

  const catalogResource = getPlanUsage().resources.catalog;
  let itemsToInsert = missing;
  if (Number.isFinite(catalogResource.limit) && missing.length > catalogResource.remaining) {
    if (catalogResource.remaining <= 0) {
      toast(resourceLimitMessage('catalog'));
      setRoute('billing');
      render();
      return;
    }
    itemsToInsert = missing.slice(0, catalogResource.remaining);
    toast(`Tu plan permite cargar ${catalogResource.remaining} item${catalogResource.remaining === 1 ? '' : 's'} más del catálogo. Se cargará una plantilla parcial.`);
  }

  if (mode === 'supabase') {
    const { error } = await supabaseClient.from('products_services').insert(itemsToInsert);
    if (error) throw error;
    await loadRemoteData();
  } else {
    itemsToInsert.forEach(item => {
      state.productsServices.unshift({ ...item, id: uid('prod'), created_at: new Date().toISOString() });
    });
    saveLocalState();
    render();
  }
  setRoute('catalog');
  toast(`Catálogo base cargado: ${itemsToInsert.length} item${itemsToInsert.length === 1 ? '' : 's'}.`);
}

async function saveMessageTemplate(form) {
  if (!guardAction('templates_create')) return;
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
  if (!guardAction('templates_delete')) return;
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
  if (!guardAction('quote_pdf')) return;
  const quote = state.quotes.find(q => q.id === id);
  if (!quote) return;
  if (!window.jspdf?.jsPDF) {
    toast('jsPDF no está disponible. Revisa tu conexión.');
    return;
  }

  const client = getClient(quote.client_id);
  const totals = quoteTotals(quote);
  const doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'letter' });
  if (getEffectivePlan().lockedPdfWatermark) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(46);
    doc.setTextColor(220, 220, 220);
    doc.text('DEMO', 245, 390, { angle: 35 });
    doc.setTextColor(0, 0, 0);
  }
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
  const normalizedPlan = normalizePlanKey(planKey);
  const plan = PLAN_CATALOG[normalizedPlan];
  if (!plan || normalizedPlan === 'demo') {
    toast('Plan inválido para checkout.');
    return;
  }
  if (normalizedPlan === 'crm_empresa' || plan.price === null) {
    window.location.href = salesContactUrl(normalizedPlan);
    return;
  }
  if (mode !== 'supabase') {
    toast('Publica y entra con Supabase antes de cobrar planes reales. En demo local solo se simula el uso.');
    return;
  }
  const { data, error } = await supabaseClient.functions.invoke('create-checkout', {
    body: { plan: normalizedPlan, referral_code: getPendingReferralCode() }
  });
  if (error) throw error;
  if (!data?.url) throw new Error('El backend no devolvió URL de checkout. Revisa variables de Lemon Squeezy o Paddle.');
  window.location.href = data.url;
}

async function syncSaasEntitlementFromBilling(planId, status, periodStart, periodEnd) {
  if (mode !== 'supabase' || !supabaseClient || !state.company?.id) return;
  const plan = PLAN_CATALOG[planId] || PLAN_CATALOG.demo;
  const payload = {
    company_id: state.company.id,
    plan_id: planId,
    plan_name: plan.name,
    subscription_status: status,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    max_users: plan.users,
    max_clients: plan.maxClients,
    max_quotes_per_month: plan.maxQuotesPerMonth,
    max_invoices_per_month: plan.maxInvoicesPerMonth,
    max_exports_per_month: plan.maxExportsPerMonth,
    catalog_limit: plan.catalogLimit,
    updated_at: new Date().toISOString()
  };
  try {
    const { error } = await supabaseClient
      .from('company_saas_entitlements')
      .upsert(payload, { onConflict: 'company_id' });
    if (error) throw error;
    state.saasEntitlement = { ...(state.saasEntitlement || {}), ...payload };
  } catch (error) {
    console.warn('No se pudo sincronizar company_saas_entitlements; se usará billing_subscriptions/companies como fuente:', error.message || error);
    state.saasEntitlement = state.saasEntitlement && normalizePlanKey(state.saasEntitlement.plan_id) === planId ? state.saasEntitlement : null;
  }
}

async function saveBillingManual(form) {
  if (!requirePermission('billing_manage')) return;
  if (!can('users_manage')) {
    toast('Solo el Superusuario puede modificar el estado de suscripción.');
    return;
  }
  const fd = new FormData(form);
  const planId = normalizePlanKey(fd.get('plan_id'));
  const plan = PLAN_CATALOG[planId] || PLAN_CATALOG.demo;
  const status = normalizeSubscriptionStatus(fd.get('subscription_status'));
  const periodStart = safeDateOnly(fd.get('current_period_start')) || null;
  const periodEnd = safeDateOnly(fd.get('current_period_end')) || null;
  const nextBillingDate = safeDateOnly(fd.get('next_billing_date')) || periodEnd || null;
  const payload = {
    company_id: state.company.id,
    plan: planId,
    plan_id: planId,
    plan_name: plan.name,
    status,
    subscription_status: status,
    payment_provider: String(fd.get('payment_provider') || 'manual').trim(),
    current_period_start: periodStart,
    current_period_end: periodEnd,
    next_billing_date: nextBillingDate,
    last_payment_status: String(fd.get('last_payment_status') || '').trim(),
    manual_payment_method: String(fd.get('manual_payment_method') || '').trim(),
    internal_notes: String(fd.get('internal_notes') || '').trim(),
    setup_status: String(fd.get('setup_status') || 'not_required').trim(),
    setup_fee_amount: Number(fd.get('setup_fee_amount') || 0),
    updated_at: new Date().toISOString()
  };
  const companyPayload = {
    plan: planId,
    active_plan_id: planId,
    subscription_status: status,
    payment_provider: payload.payment_provider,
    current_period_start: periodStart,
    plan_current_period_end: periodEnd,
    next_billing_date: nextBillingDate,
    last_payment_status: payload.last_payment_status,
    manual_payment_method: payload.manual_payment_method,
    billing_internal_notes: payload.internal_notes,
    setup_status: payload.setup_status,
    setup_fee_amount: payload.setup_fee_amount,
    updated_at: new Date().toISOString()
  };

  if (mode === 'supabase') {
    let billingResult;
    if (state.billing?.id) {
      billingResult = await supabaseClient.from('billing_subscriptions').update(payload).eq('id', state.billing.id).select('*').single();
    } else {
      billingResult = await supabaseClient.from('billing_subscriptions').insert(payload).select('*').single();
    }
    if (billingResult.error) throw billingResult.error;
    state.billing = billingResult.data;
    const { data: companyData, error: companyError } = await supabaseClient.from('companies').update(companyPayload).eq('id', state.company.id).select('*').single();
    if (companyError) throw companyError;
    state.company = normalizeCompany(companyData);
    await syncSaasEntitlementFromBilling(planId, status, periodStart, periodEnd);
    await loadSaasEntitlement();
  } else {
    state.billing = { ...(state.billing || {}), ...payload, id: state.billing?.id || uid('billing') };
    state.company = { ...state.company, ...companyPayload };
    saveLocalState();
  }
  toast('Estado de plan guardado.');
  setRoute('billing');
  render();
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
  if (event.target.classList?.contains('auth-modal-backdrop')) {
    setRoute('home');
    render();
    return;
  }
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
  const email = actionEl.dataset.email;
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
    if (action === 'activate-team-member') await activateTeamMember(id);
    if (action === 'delete-team-member') await deleteTeamMember(id);
    if (action === 'send-setup-email') await sendUserSetupEmail(email);
    if (action === 'clear-logo') clearCompanyLogo();
    if (action === 'delete-milk-record') await deleteMilkRecord(id);
    if (action === 'milk-pdf') generateMilkPdf();
    if (action === 'milk-csv') exportMilkCsv();
    if (action === 'milk-settlement-pdf') generateMilkSettlementPdf();
    if (action === 'milk-settlement-csv') exportMilkSettlementCsv();
    if (action === 'convert-quote-invoice') await convertQuoteToInvoice(id);
    if (action === 'issue-invoice') await issueInvoice(id);
    if (action === 'void-invoice') await voidInvoice(id);
    if (action === 'invoice-pdf') generateInvoicePdf(id);
    if (action === 'copy-invoice-whatsapp') await copyInvoiceWhatsapp(id);
    if (action === 'export-commercial-report-csv') await exportCommercialReportCsv();
    if (action === 'clear-report-filters') { state.reportFilters = { period: 'all', status: 'all', attention: 'all' }; saveLocalState(); setRoute('reports'); render(); }
    if (action === 'copy-diagnostic-summary') await copyDiagnosticSummary();
    if (action === 'deactivate-global-user') await setGlobalUserStatus(target.dataset.id, 'inactive');
    if (action === 'activate-global-user') await setGlobalUserStatus(target.dataset.id, 'active');
    if (action === 'disable-auth-user') await setAuthUserLoginStatus(target.dataset.email, false);
    if (action === 'enable-auth-user') await setAuthUserLoginStatus(target.dataset.email, true);
    if (action === 'send-auth-recovery') await sendAuthRecoveryFromDiagnostics(target.dataset.email);
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
    if (type === 'forgot-password') await handleForgotPassword(form);
    if (type === 'password-reset-code') await handlePasswordResetCode(form);
    if (type === 'password-update') await handleUpdatePassword(form);
    if (type === 'company') await saveCompany(form);
    if (type === 'billing-manual') await saveBillingManual(form);
    if (type === 'client') await saveClient(form);
    if (type === 'quote') await saveQuote(form);
    if (type === 'affiliate') await saveAffiliate(form);
    if (type === 'product-service') await saveProductService(form);
    if (type === 'message-template') await saveMessageTemplate(form);
    if (type === 'team-member') await saveTeamMember(form);
    if (type === 'diagnostic-user-lookup') await lookupDiagnosticUser(form);
    if (type === 'diagnostic-user-access') await saveDiagnosticUserAccess(form);
    if (type === 'milk-delivery') await saveMilkDelivery(form);
    if (type === 'invoice-payment') await saveInvoicePayment(form);
    if (type === 'milk-filters') handleMilkFilters(form);
    if (type === 'milk-settlement-filters') handleMilkSettlementFilters(form);
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

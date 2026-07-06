const STORAGE_KEY = 'cotizaflow_fase2_local_state_v1';
const config = window.COTIZAFLOW_CONFIG || {};
const app = document.getElementById('app');

let supabaseClient = null;
let mode = 'local';
let state = {
  loading: true,
  session: null,
  company: null,
  clients: [],
  quotes: [],
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
  subscription_status: 'trialing'
};

const localDefaultState = {
  session: null,
  company: { ...defaultCompany },
  clients: [],
  quotes: []
};

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
      quotes: parsed.quotes || []
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
    quotes: state.quotes
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

    const [{ data: clients, error: clientsError }, { data: quotes, error: quotesError }] = await Promise.all([
      supabaseClient.from('clients').select('*').eq('company_id', state.company.id).order('created_at', { ascending: false }),
      supabaseClient.from('quotes').select('*, quote_items(*)').eq('company_id', state.company.id).order('created_at', { ascending: false })
    ]);

    if (clientsError) throw clientsError;
    if (quotesError) throw quotesError;

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
      subscription_status: 'trialing'
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

function normalizeCompany(company) {
  return { ...defaultCompany, ...(company || {}) };
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
            <span class="eyebrow">Fase 2 · ${usingSupabase ? 'Supabase conectado' : 'modo local hasta configurar Supabase'}</span>
            <h1>Cotizaciones profesionales con datos en la nube.</h1>
            <p>Crea clientes, cotizaciones y PDF. La fase 2 ya está preparada para autenticación real, PostgreSQL y separación de datos por empresa.</p>
            <div class="hero-actions">
              <button class="btn primary" data-route="auth">Crear cuenta</button>
              <button class="btn secondary" data-action="start-demo">Demo local</button>
            </div>
            <div class="bullets">
              <span>Auth por correo y contraseña cuando Supabase está configurado.</span>
              <span>Base de datos PostgreSQL con RLS para aislar empresas.</span>
              <span>Modo local conservado para pruebas rápidas en VS Code.</span>
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
          ${navLink('clients', 'Clientes')}
          ${navLink('settings', 'Empresa')}
          ${navLink('integrations', 'Integraciones')}
        </nav>
        <div class="sidebar-footer">
          <strong>${escapeHtml(state.company?.name || 'Mi empresa')}</strong><br />
          ${mode === 'supabase' ? 'Modo Supabase' : 'Modo demo local'}<br />
          Plan: ${escapeHtml(state.company?.plan || 'free')} · ${escapeHtml(state.company?.subscription_status || 'trialing')}<br />
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
    case 'clients': return renderClients();
    case 'settings': return renderSettings();
    case 'integrations': return renderIntegrations();
    case 'dashboard':
    default: return renderDashboard();
  }
}

function renderDashboard() {
  const quotes = state.quotes;
  const pending = quotes.filter(q => ['draft', 'sent'].includes(q.status));
  const accepted = quotes.filter(q => q.status === 'accepted');
  const totalPending = pending.reduce((sum, q) => sum + quoteTotals(q).total, 0);
  const totalAccepted = accepted.reduce((sum, q) => sum + quoteTotals(q).total, 0);
  const latest = [...quotes].sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || ''))).slice(0, 5);

  return `
    <div class="page-header">
      <div>
        <h1>Dashboard</h1>
        <p>Resumen de clientes y cotizaciones. Fuente actual: ${mode === 'supabase' ? 'Supabase PostgreSQL' : 'LocalStorage'}.</p>
      </div>
      <div class="header-actions">
        <button class="btn primary" data-route="quote-new">Nueva cotización</button>
        <button class="btn secondary" data-route="clients">Crear cliente</button>
      </div>
    </div>

    <section class="grid cols-4">
      <div class="card metric"><span>Total cotizaciones</span><strong>${quotes.length}</strong></div>
      <div class="card metric"><span>Pendientes</span><strong>${pending.length}</strong></div>
      <div class="card metric"><span>Aceptadas</span><strong>${accepted.length}</strong></div>
      <div class="card metric"><span>Clientes</span><strong>${state.clients.length}</strong></div>
    </section>

    <section class="grid cols-2" style="margin-top:18px;">
      <div class="card metric"><span>Monto pendiente</span><strong>${money(totalPending)}</strong></div>
      <div class="card metric"><span>Monto aceptado</span><strong>${money(totalAccepted)}</strong></div>
    </section>

    <section class="card" style="margin-top:18px;">
      <h2>Últimas cotizaciones</h2>
      ${latest.length ? renderQuotesTable(latest, true) : `<div class="empty">Todavía no tienes cotizaciones.</div>`}
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
        <div class="field" style="grid-column:1/-1;"><label>Dirección</label><textarea name="address">${escapeHtml(c.address)}</textarea></div>
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
    notes: 'Gracias por considerar nuestra propuesta. Esta cotización está sujeta a disponibilidad y vigencia indicada.',
    items: [{ id: uid('item'), description: '', quantity: 1, unit_price: 0, total: 0 }]
  };

  return `
    <div class="page-header">
      <div>
        <h1>${editing ? 'Editar cotización' : 'Nueva cotización'}</h1>
        <p>${editing ? 'Actualiza la propuesta.' : 'Crea una cotización profesional.'}</p>
      </div>
      <button class="btn secondary" data-route="quotes">Volver</button>
    </div>

    ${state.clients.length ? '' : `<div class="notice warning">Primero debes crear un cliente para asociar la cotización.</div>`}

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
        <button class="btn primary" type="submit" ${state.clients.length ? '' : 'disabled'}>Guardar cotización</button>
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
  const message = whatsappMessage(quote);

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
      <h2>Mensaje WhatsApp</h2>
      <p class="help">Copia este texto y envía el PDF generado. El link público seguro entra en fase 3 con API protegida.</p>
      <textarea class="copy-box" readonly>${escapeHtml(message)}</textarea>
      <button class="btn secondary" data-action="copy-whatsapp" data-id="${quote.id}">Copiar mensaje</button>
    </section>
  `;
}

function renderIntegrations() {
  return `
    <div class="page-header">
      <div>
        <h1>Integraciones</h1>
        <p>Estado técnico de la fase 2 y preparación para las próximas fases.</p>
      </div>
    </div>

    <section class="grid cols-2">
      <div class="card">
        <h2>Base de datos</h2>
        <p><strong>Estado:</strong> ${mode === 'supabase' ? 'Supabase conectado' : 'modo local'}</p>
        <p class="help">Para activar Supabase, ejecuta el SQL incluido en <code>supabase/schema.sql</code> y configura <code>config.js</code>.</p>
      </div>
      <div class="card">
        <h2>Próximas integraciones</h2>
        <div class="bullets">
          <span>Pagos y planes con Lemon Squeezy o Paddle.</span>
          <span>Referidos con comisión configurable.</span>
          <span>Emails automáticos con Resend.</span>
          <span>Links públicos seguros con Worker o Edge Function.</span>
        </div>
      </div>
    </section>
  `;
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
    tax_rate: Number(fd.get('tax_rate') || 0)
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

function whatsappMessage(quote) {
  const client = getClient(quote.client_id);
  const totals = quoteTotals(quote);
  return `Hola ${client?.name || ''}, te compartimos la cotización ${quote.quote_number} por un total de ${money(totals.total)}. Vigencia: ${quote.valid_until || 'no especificada'}. Quedamos atentos a tu confirmación.`;
}

async function copyWhatsapp(id) {
  const quote = state.quotes.find(q => q.id === id);
  if (!quote) return;
  await navigator.clipboard.writeText(whatsappMessage(quote));
  toast('Mensaje copiado.');
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

  try {
    if (action === 'start-demo') startDemo();
    if (action === 'logout') await logout();
    if (action === 'add-item') addItemRow();
    if (action === 'remove-item') removeItemRow(actionEl);
    if (action === 'delete-client') await deleteClient(id);
    if (action === 'delete-quote') await deleteQuote(id);
    if (action === 'pdf') generatePdf(id);
    if (action === 'copy-whatsapp') await copyWhatsapp(id);
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
  } catch (error) {
    console.error(error);
    toast(error.message || 'No se pudo guardar.');
  }
});

app.addEventListener('input', (event) => {
  if (event.target.closest('[data-form="quote"]')) recalcQuoteForm();
});

window.addEventListener('hashchange', render);
